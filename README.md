## Personal Dashboard (Amazon + Electricity)

See Amazon Pay balances and APSPDCL electricity bills in one place.

### Features

- Secure auth (bcrypt + JWT; 12h access)
- Add multiple Amazon accounts; credentials encrypted at rest (AES‑256‑GCM)
- Region support: `amazon.in` only (others disabled)
- Playwright scraping with manual Captcha/2FA handling and storageState session
- Refresh one/all; history snapshots; totals and base-currency conversion
- Rewards tab: grouped Amazon rewards with structured fields
- Electricity (APSPDCL): services CRUD, bill refresh (API-based), due amount, billed units, last 3 bills
- Debug/health info, session countdown, dark/light theme, mobile-friendly

### Tech Stack

- Backend: Node.js + Express (Render/Cloud Run), MongoDB Atlas
- Frontend: React + Vite (Vercel), HashRouter
- Scraping: Playwright (Chromium, storageState per account)
- APSPDCL: public bill history API

### Local Development

1) Backend
```bash
cp backend/.env.example backend/.env
# set MONGODB_URI, JWT secrets, CREDENTIALS_ENCRYPTION_KEY, CORS_ORIGIN
cd backend && npm install && npm run dev
```

2) Frontend
```bash
cp frontend/.env.example frontend/.env
# set VITE_API_URL (e.g., http://localhost:4000)
cd frontend && npm install && npm run dev
```

### Environment Variables (Backend)

- `MONGODB_URI` (required), `MONGODB_DB_NAME` (default: `amazon_wallet_monitor`)
- `JWT_SECRET`, `JWT_REFRESH_SECRET` (strong, random; distinct)
- `JWT_ACCESS_TTL` (default: `12h`), `JWT_REFRESH_TTL` (default: `7d`)
- `CREDENTIALS_ENCRYPTION_KEY` (32+ chars; changing it invalidates stored creds)
- `CORS_ORIGIN` (your frontend origin, comma-separated if multiple)

Generate secrets:
```bash
openssl rand -hex 64
# or
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Note: `NODE_ENV` is optional on Render (defaults to production).

### Deployment

Backend (Render / Cloud Run)
- Docker-based on Playwright image or Node build with Playwright install
- Expose port 4000/8080; set env vars (MONGODB_URI, JWT secrets, CREDENTIALS_ENCRYPTION_KEY, CORS_ORIGIN)

Frontend (Vercel)
- Set `VITE_API_URL` to your backend URL
- `vercel.json` enforces strict CSP and SPA rewrites

### Security Notes

- Never log raw Amazon credentials. They are AES‑256‑GCM encrypted at rest
- Manual 2FA/Captcha: storageState seeded locally once (see SESSIONS.md)
- JWT access + refresh tokens; access ~12h; refresh endpoint available

### Usage Notes

- Homepage at `/` explains features and has Sign in. Unauthenticated or expired sessions redirect to `/`.
- Only `amazon.in` is supported. If you need other regions, extend selectors and models accordingly.
- For Amazon accounts, seed `storageState` locally once and upload via dashboard (see SESSIONS.md).

