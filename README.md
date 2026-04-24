# SRM Round 1 — BFHL Full Stack (Node.js + React)

This repo contains:
- **Backend API**: Express server implementing `POST /bfhl` per the challenge rules
- **Frontend SPA**: React (Vite) UI to submit edges and view the response

## Live deployment

- **Backend (Render)**: `https://bajaj-project-2aq9.onrender.com`
- **Frontend (Vercel)**: `https://bajaj-project-sable.vercel.app/`

## Local setup

### Backend (API)

```bash
cd server
npm install
npm run dev
```

API runs on `http://localhost:3000`
- `GET /health`
- `POST /bfhl`

### Frontend

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies `/bfhl` to `http://localhost:3000`.

## Production setup (important)

In production, the Vite proxy does not apply. Set:
- `VITE_API_URL` to your hosted backend base URL (example: `https://bajaj-project-2aq9.onrender.com`)

See `.env.example`.

## Deploy Backend (Render)

1. Push this project to GitHub.
2. Go to Render → **New** → **Web Service** → connect your repo.
3. Configure:
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Deploy. Your API base URL will look like `https://xxxx.onrender.com` (example: `https://bajaj-project-2aq9.onrender.com`)

Check:
- `GET <api-url>/health`
- `POST <api-url>/bfhl`

## Deploy Frontend (Vercel)

1. Go to Vercel → **New Project** → import your repo.
2. Configure:
   - **Root Directory**: `.` (the Vite app is the project root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add environment variable:
   - `VITE_API_URL` = `https://bajaj-project-2aq9.onrender.com` 
4. Deploy.

## Required identity fields

Update these in `server/index.js`:
- `user_id` (format `fullname_ddmmyyyy`)
- `email_id`
- `college_roll_number`

