import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import AmazonAccount from "../models/AmazonAccount.js";
import Balance from "../models/Balance.js";
import { decryptSecret } from "../utils/crypto.js";
import { fetchAmazonPayBalance } from "../services/scraper.js";
import rateLimit from 'express-rate-limit'

const router = Router();

router.use(requireAuth);

// Per-user limiter: max 5 refresh calls per 24h per user (tunable)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(s=> s.trim().toLowerCase()).filter(Boolean)
const refreshLimiter = rateLimit({
  windowMs: 24*60*60*1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req)=> req.user?.id || req.ip,
  skip: (req)=> ADMIN_EMAILS.includes((req.user?.email||'').toLowerCase()),
  handler: (_req, res)=> res.status(429).json({ error: 'Rate limit exceeded (5/day). Please try tomorrow.' })
})

router.get("/history/:accountId", async (req, res, next) => {
  try {
    const account = await AmazonAccount.findOne({ _id: req.params.accountId, userId: req.user.id });
    if (!account) return res.status(404).json({ error: "Account not found" });
    const history = await Balance.find({ accountId: account._id }).sort({ createdAt: -1 }).limit(200);
    res.json(history);
  } catch (e) {
    next(e);
  }
});

router.post("/refresh/:accountId", refreshLimiter, async (req, res, next) => {
  try {
    const account = await AmazonAccount.findOne({ _id: req.params.accountId, userId: req.user.id });
    if (!account) return res.status(404).json({ error: "Account not found" });

    const password = decryptSecret(account.encryptedPassword);
    const { amount, currency, storageState, debug } = await fetchAmazonPayBalance({
      region: account.region,
      email: account.email,
      password,
      interactive: process.env.NODE_ENV !== 'production',
      storageState: account.storageState,
    });

    account.lastBalance = amount;
    account.lastCurrency = currency;
    account.lastRefreshedAt = new Date();
    if (storageState) account.storageState = storageState;
    await account.save();

    const snap = await Balance.create({ accountId: account._id, amount, currency });
    res.json({ amount, currency, timestamp: snap.createdAt, debug });
  } catch (e) {
    try {
      const account = await AmazonAccount.findOne({ _id: req.params.accountId, userId: req.user.id });
      if (account) {
        account.lastError = e?.message || 'Refresh failed';
        account.lastErrorAt = new Date();
        await account.save();
      }
    } catch {}
    next(e);
  }
});

router.post("/refresh-all", refreshLimiter, async (req, res, next) => {
  try {
    const accounts = await AmazonAccount.find({ userId: req.user.id }).sort({ createdAt: 1 });
    const batchSize = Math.max(1, Math.min(5, Number(req.body?.batchSize) || 3));
    const results = [];
    for (let i = 0; i < accounts.length; i += batchSize) {
      const chunk = accounts.slice(i, i + batchSize);
      const settled = await Promise.allSettled(chunk.map(async (account, idx) => {
        const password = decryptSecret(account.encryptedPassword);
        const { amount, currency, storageState } = await fetchAmazonPayBalance({
          region: account.region,
          email: account.email,
          password,
          interactive: process.env.NODE_ENV !== 'production',
          storageState: account.storageState,
        });
        account.lastBalance = amount;
        account.lastCurrency = currency;
        account.lastRefreshedAt = new Date();
        if (storageState) account.storageState = storageState;
        await account.save();
        const snap = await Balance.create({ accountId: account._id, amount, currency });
        return { accountId: account._id, amount, currency, index: i + idx + 1, total: accounts.length, timestamp: snap.createdAt };
      }));
      for (const r of settled) {
        if (r.status === 'fulfilled') results.push(r.value);
        else {
          const err = r.reason;
          const acc = chunk[settled.indexOf(r)];
          if (acc) {
            acc.lastError = err?.message || 'Refresh failed';
            acc.lastErrorAt = new Date();
            try { await acc.save(); } catch {}
            results.push({ accountId: acc._id, error: acc.lastError, index: accounts.indexOf(acc) + 1, total: accounts.length });
          }
        }
      }
    }
    res.json({ results, batchSize });
  } catch (e) {
    next(e);
  }
});

export default router;

