# Deploying the HRMS (free tier)

Three free services, set up in this order:

1. **MongoDB Atlas** - the database
2. **Render** - the backend API
3. **Vercel** - the website (it also forwards `/api` to Render, so the login cookie stays first-party)

You will need to create the accounts yourself. Keep every password and connection string private.

---

## 0. Put the code on GitHub

```bash
cd "Human Resource Management System"
git init
git add .
git status          # check that NO .env file and no node_modules are listed
git commit -m "HRMS"
# create an empty repository on github.com, then:
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

The `.gitignore` files already exclude `.env`, `node_modules` and the local database.

## 1. MongoDB Atlas

1. Sign up at https://www.mongodb.com/atlas and create a **free (M0)** cluster.
2. **Database Access** -> add a database user (username + a strong password, no `@ : /` characters).
3. **Network Access** -> add `0.0.0.0/0` (Render's free servers have changing addresses).
4. **Connect -> Drivers** -> copy the connection string and put the database name before the `?`:

   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/hrms?retryWrites=true&w=majority`

   This is your `MONGO_URI`.

## 2. Render (backend)

1. Sign up at https://render.com and connect your GitHub account.
2. **New -> Blueprint**, choose your repository (it reads `render.yaml`).
   *Or* **New -> Web Service** with: Root Directory `backend`, Build `npm install`, Start `npm start`.
3. Fill in the environment variables:

   | Variable | Value |
   |---|---|
   | `MONGO_URI` | the Atlas string from step 1 |
   | `JWT_SECRET` | generated automatically by the blueprint (or any 64+ random characters) |
   | `FRONTEND_URL` | your Vercel address, e.g. `https://hrms-yourname.vercel.app` (set it after step 4) |
   | `NODE_ENV` | `production` |
   | `TRUST_PROXY` | `1` |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | your first admin account |

4. When it finishes, open `https://<your-service>.onrender.com/api/health` - it should say
   `"database":"connected"`.

The free plan sleeps after about 15 minutes without traffic, so the first request after a pause
takes ~30-60 seconds.

## 3. Create the first admin account

The production database is empty. From your own computer, run the seed script against Atlas
(PowerShell):

```powershell
cd backend
$env:MONGO_URI = "<your Atlas connection string>"
$env:ADMIN_EMAIL = "you@example.com"
$env:ADMIN_PASSWORD = "A-strong-password-1!"
$env:ADMIN_NAME = "HR Administrator"
npm run seed
```

It prints `Admin created: ...`. The password must have 8+ characters with an uppercase letter, a
lowercase letter, a number and a symbol.

## 4. Vercel (frontend)

1. Open `frontend/vercel.json` and replace `YOUR-BACKEND-NAME.onrender.com` with your real Render
   address, then commit and push.
2. Sign up at https://vercel.com, **Add New -> Project**, import the repository.
3. Settings: **Root Directory** `frontend`, Framework **Vite**, Build `npm run build`, Output `dist`.
   No environment variable is needed (`frontend/.env.production` already sets `VITE_API_URL=/api`).
4. Deploy, then copy your Vercel address.

## 5. Connect the two

Go back to Render -> your service -> **Environment** -> set `FRONTEND_URL` to the Vercel address
(no trailing slash) and let it redeploy. Open the Vercel address and sign in.

## Checklist after deploying

- [ ] `https://<render>/api/health` shows the database as connected
- [ ] You can sign in on the Vercel address and refresh the page without being logged out
- [ ] Change the admin password under **Profile -> Change password**
- [ ] Add a test employee, check in as that employee, apply for leave, approve it, generate payroll
- [ ] Delete the test data before real use

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| "Login failed" immediately | Backend asleep (wait a minute and retry), or `vercel.json` still has `YOUR-BACKEND-NAME` |
| Browser console shows a CORS error | `FRONTEND_URL` on Render does not exactly match the Vercel address |
| Signs in, then is sent back to login | Cookie blocked: make sure the site is opened over `https://` on the Vercel address and requests go to `/api` (not directly to onrender.com) |
| `429 Too many attempts` | 20 failed logins from one address in 15 minutes - wait, or restart the Render service |
| Server exits at start with "Missing required env variable" | `MONGO_URI` or `JWT_SECRET` not set on Render |
| `MongoServerError: bad auth` | Wrong Atlas username or password in `MONGO_URI` |

## Keeping it safe

- Never commit `.env` files or paste connection strings into chat or issues.
- Use a long random `JWT_SECRET`. Changing it logs everyone out.
- If a password or connection string was shared by accident, change it in Atlas / the app and update Render.
