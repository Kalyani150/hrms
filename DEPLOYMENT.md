# Deploying the HRMS: backend on Render, frontend on Vercel

Two services from the same GitHub repository, plus a free MongoDB Atlas database:

| Service | Where | Root directory | What it is | Example address |
|---|---|---|---|---|
| **hrms-backend** | Render (Web Service) | `backend` | Express API, a normal Node server | `https://hrms-backend-xxxx.onrender.com` |
| **frontend** | Vercel | `frontend` | React site; it forwards `/api` to the backend | `https://frontend-xxxx.vercel.app` |

The site forwards `/api/...` to the Render backend, so the browser only ever talks to the frontend's
address. The login cookie therefore stays first-party and works in every browser. Refreshing any page
(for example `/employees`) works too, because `frontend/vercel.json` sends every non-API path to
`index.html`.

## 1. MongoDB Atlas

1. Create a free **M0** cluster at https://www.mongodb.com/atlas.
2. **Database Access** -> add a database user (strong password, no `@ : /` characters).
3. **Network Access** -> add `0.0.0.0/0` (Render's free plan has no fixed IP address).
4. **Connect -> Drivers** -> copy the string and put the database name before the `?`:

   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/hrms?retryWrites=true&w=majority`

## 2. Backend on Render

1. On https://render.com choose **New -> Blueprint** and pick this repository. Render reads
   `render.yaml` and creates the `hrms-backend` web service.
   (Without the Blueprint: **New -> Web Service**, Root Directory `backend`, Build Command
   `npm install`, Start Command `npm start`, Health Check Path `/api/health`.)
2. Set the environment variables (Service -> Environment):

| Variable | Value |
|---|---|
| `MONGO_URI` | the Atlas string from step 1 |
| `JWT_SECRET` | created for you by the Blueprint (otherwise a long random string) |
| `NODE_ENV` | `production` |
| `TRUST_PROXY` | `1` |
| `ADMIN_EMAIL` | the email you will sign in with |
| `ADMIN_PASSWORD` | 8+ characters with an uppercase letter, a lowercase letter, a number and one of `! @ # $ % & * _ -` |
| `ADMIN_NAME` | `HR Administrator` (letters and spaces only) |
| `FRONTEND_URL` | the frontend's address (set it after step 3) |

3. Deploy. Then open `https://<service>.onrender.com/api/health`; it should say `"database":"connected"`.

On the first start with an empty database the backend creates the first admin from `ADMIN_*`
(look for `First admin created` in the Render logs).

Render redeploys automatically on every push to `main`.

## 3. Frontend on Vercel

1. Edit `frontend/vercel.json` and replace `YOUR-BACKEND.onrender.com` with the backend's real address,
   then commit and push.
2. Import the repository on Vercel with **Root Directory = `frontend`**, Framework **Vite**,
   Build `npm run build`, Output `dist`. No environment variable is needed
   (`frontend/.env.production` already sets `VITE_API_URL=/api`).
3. Set `FRONTEND_URL` on the Render service to the frontend's address and let it redeploy.

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
| Health shows HTTP 500 "Server error" | `MONGO_URI` / `JWT_SECRET` missing, or Atlas Network Access does not allow `0.0.0.0/0`. Open **Logs** on Render for the exact reason |
| `bad auth` in the logs | Wrong Atlas username or password in `MONGO_URI` |
| First request after a quiet period takes ~30-60 seconds | Normal on Render's free plan: the service sleeps when idle and wakes on the next request |
| "Login failed" on the site | `frontend/vercel.json` still contains the `YOUR-BACKEND` placeholder, or the backend is asleep, down or not deployed |
| Page not found after refresh | `frontend/vercel.json` was changed so that the second rewrite (`/index.html`) is missing |
| Cannot sign in as admin, log says "First admin was not created" | `ADMIN_PASSWORD` breaks the strength rule, or `ADMIN_EMAIL` is invalid |
| `429 Too many attempts` | Many failed logins in 15 minutes; wait, then retry |

## Notes and limits

- Render's free plan sleeps after about 15 minutes without traffic. The first request afterwards is slow;
  a paid plan keeps it awake.
- The login rate limiter keeps its counters in memory, so a restart resets them.
- Never commit `.env` files or paste connection strings into chat. Change any password that was shared.
