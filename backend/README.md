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

### Security

- Credentials are encrypted at rest. Never log raw credentials.
- JWT required for all account and balance routes.
- Rate-limited and secured via Helmet.

### Deployment (Render)

- Build Command: `npm install`
- Start Command: `npm start`
- Add env vars as above
- Enable persistent disk if you want cached browser data (optional)

