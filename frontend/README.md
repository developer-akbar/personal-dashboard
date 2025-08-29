## Frontend - Amazon Wallet Monitor

React + Vite app for the dashboard.

### Run locally

1. Copy `.env.example` to `.env` and set `VITE_API_URL`
2. Install deps: `npm install`
3. Start dev: `npm run dev`

### Pages

- `/login`, `/register`
- `/dashboard` account cards, totals, refresh
- `/account/:id` history chart
- `/settings` base currency

### Deployment (Vercel)

1. Import this project into Vercel with the `frontend/` directory
2. Set Environment Variable: `VITE_API_URL` → your Render backend URL (e.g., `https://your-app.onrender.com`)
3. Build Command: `npm ci && npm run build`
4. Output Directory: `dist`

Notes
- `vercel.json` enforces a strict CSP and SPA routing to `index.html`
- The dashboard assumes HTTPS when talking to the backend
