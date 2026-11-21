# Deploying the HRMS on Vercel (free tier)

Two Vercel projects from the same GitHub repository, plus a free MongoDB Atlas database:

| Project | Root directory | What it is | Example address |
|---|---|---|---|
| **hrms-backend** | `backend` | Express API, run as a serverless function | `https://hrms-backend-xxxx.vercel.app` |
| **hrms-frontend** | `frontend` | React site; it forwards `/api` to the backend | `https://hrms-frontend-xxxx.vercel.app` |

Because the site forwards `/api/...` to the backend, the browser only ever talks to the frontend's
address. The login cookie therefore stays first-party and works in every browser. Refreshing any page
(for example `/employees`) works too, because `frontend/vercel.json` sends every non-API path to
`index.html`.

## 1. MongoDB Atlas

1. Create a free **M0** cluster at https://www.mongodb.com/atlas.
2. **Database Access** -> add a database user (strong password, no `@ : /` characters).
3. **Network Access** -> add `0.0.0.0/0` (Vercel functions have changing addresses).
4. **Connect -> Drivers** -> copy the string and put the database name before the `?`:

   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/hrms?retryWrites=true&w=majority`

## 2. Backend project (`hrms-backend`)

Environment variables (Project -> Settings -> Environment Variables, for **Production**):

| Variable | Value |
|---|---|
| `MONGO_URI` | the Atlas string from step 1 |
| `JWT_SECRET` | a long random string, e.g. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ADMIN_EMAIL` | the email you will sign in with |
| `ADMIN_PASSWORD` | 8+ characters with an uppercase letter, a lowercase letter, a number and a symbol |
| `ADMIN_NAME` | `HR Administrator` (letters and spaces only) |
| `FRONTEND_URL` | the frontend's address (set it after step 3) |
| `TRUST_PROXY` | `1` |

Deploy with the Vercel CLI from the `backend` folder (`npx vercel --prod`) or import the repository in
the dashboard with **Root Directory = `backend`**. Then open
`https://<backend-address>/api/health`; it should say `"database":"connected"`.

On the first request after a deploy the backend creates the first admin from `ADMIN_*` if the database
has no admin yet (look for `First admin created` in the function logs).

## 3. Frontend project (`hrms-frontend`)

1. Edit `frontend/vercel.json` and replace `YOUR-BACKEND.vercel.app` with the backend's real address,
   then commit and push.
2. Deploy with `npx vercel --prod` from the `frontend` folder, or import the repository with
   **Root Directory = `frontend`**, Framework **Vite**, Build `npm run build`, Output `dist`.
   No environment variable is needed (`frontend/.env.production` already sets `VITE_API_URL=/api`).
3. Set `FRONTEND_URL` on the backend project to the frontend's address and redeploy the backend.

## Checklist

- [ ] `https://<backend>/api/health` shows the database as connected
- [ ] The frontend address opens the login page and you can sign in
- [ ] Refreshing `/dashboard`, `/employees`, `/payroll` ... never shows "page not found"
- [ ] You are still signed in after refreshing
- [ ] Change the admin password under **Profile -> Change password**
- [ ] Add a test employee, check in as them, apply for leave, approve it, generate payroll
- [ ] Delete the test data before real use

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Health shows HTTP 500 "Server error" | `MONGO_URI` / `JWT_SECRET` missing, or Atlas Network Access does not allow `0.0.0.0/0`. Open **Logs** on the backend project for the exact reason |
| `bad auth` in the logs | Wrong Atlas username or password in `MONGO_URI` |
| "Login failed" on the site | `frontend/vercel.json` still contains the `YOUR-BACKEND` placeholder, or the backend is not deployed |
| Page not found after refresh | `frontend/vercel.json` was changed so that the second rewrite (`/index.html`) is missing |
| Cannot sign in as admin, log says "First admin was not created" | `ADMIN_PASSWORD` breaks the strength rule, or `ADMIN_EMAIL` is invalid |
| `429 Too many attempts` | Many failed logins in 15 minutes; wait, then retry |

## Notes and limits

- The login rate limiter keeps its counters in memory, and each serverless instance has its own, so on
  Vercel it is a soft limit. Use a strong admin password.
- Vercel's free plan stops a request after 10 seconds, which is plenty for this app.
- Never commit `.env` files or paste connection strings into chat. Change any password that was shared.
