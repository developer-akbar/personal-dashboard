## Amazon Wallet Monitor

Track multiple Amazon account Amazon Pay wallet balances from a single dashboard.

### Features

- Secure dashboard auth (bcrypt + JWT)
- Add multiple Amazon accounts per user; credentials encrypted at rest (AES‑256‑GCM)
- Regions: `amazon.in`, `amazon.com`, `amazon.co.uk`, `amazon.de`, `amazon.ca`, `amazon.com.au`
- Playwright-powered login with manual Captcha/2FA handling (visible browser)
- Refresh single or all accounts; history snapshots; totals and base-currency conversion

### Tech Stack

- Backend: Node.js + Express (Render), MongoDB Atlas (Bitetrack cluster)
- Frontend: React (Vite) (Vercel)
- Scraping: Playwright (Chromium)

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
- `JWT_ACCESS_TTL` (default: `15m`), `JWT_REFRESH_TTL` (default: `7d`)
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

Backend (Render)
- Use `render.yaml` or create a Web Service in the Render dashboard
- Build Command: `npm ci && npx playwright install --with-deps chromium`
- Start Command: `npm start`
- Set env vars as above (ensure `CORS_ORIGIN` points to your Vercel frontend)

Frontend (Vercel)
- Set `VITE_API_URL` to your Render backend URL
- `vercel.json` enforces a strict CSP and SPA routing

### Security Notes

- Never log raw Amazon credentials. They are AES‑256‑GCM encrypted at rest
- Manual 2FA/Captcha: the Playwright browser opens non‑headless so you can solve challenges
- JWT access + refresh tokens; short access TTL; refresh endpoint available

