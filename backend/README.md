## Backend - Amazon Wallet Monitor

Node.js + Express API for managing users, Amazon accounts, and fetching Amazon Pay balances using Playwright.

### Run locally

1. Copy `.env.example` to `.env` and fill values
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`

### Environment variables

- `PORT`: API port
- `CORS_ORIGIN`: Frontend origin(s), comma-separated
- `MONGODB_URI`, `MONGODB_DB_NAME`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`
- `CREDENTIALS_ENCRYPTION_KEY`: 32+ chars used for AES-256-GCM

Secrets generation examples:
```bash
openssl rand -hex 64                    # good for JWT_* and encryption key
openssl rand -base64 48                 # alternative
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Notes:
- Use different values for `JWT_SECRET` and `JWT_REFRESH_SECRET`.
- Changing `CREDENTIALS_ENCRYPTION_KEY` will invalidate previously stored passwords.
- `NODE_ENV` is optional on Render (defaults to production).

### Security

- Credentials are encrypted at rest. Never log raw credentials.
- JWT required for all account and balance routes.
- Rate-limited and secured via Helmet.

### API Endpoints

- Auth: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`
- Accounts (JWT): `GET /accounts`, `POST /accounts`, `PUT /accounts/:id`, `DELETE /accounts/:id`
- Balances (JWT): `POST /balances/refresh/:accountId`, `POST /balances/refresh-all`, `GET /balances/history/:accountId`
- Settings (JWT): `GET /settings`, `PUT /settings`

### Deployment (Render)

- Build Command: `npm ci && npx playwright install --with-deps chromium`
- Start Command: `npm start`
- Add env vars as above
- Enable persistent disk if you want cached browser data (optional)

Using render.yaml (recommended):
- Push `render.yaml` to the repo root and "New +" → Blueprint → select repo
- Update env vars in Render dashboard after first deploy

