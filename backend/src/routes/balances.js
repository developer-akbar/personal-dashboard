import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import AmazonAccount from "../models/AmazonAccount.js";
import Balance from "../models/Balance.js";
import { decryptSecret } from "../utils/crypto.js";
import { fetchAmazonPayBalance } from "../services/scraper.js";

const router = Router();

router.use(requireAuth);

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

router.post("/refresh/:accountId", async (req, res, next) => {
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
    next(e);
  }
});

router.post("/refresh-all", async (req, res, next) => {
  try {
    const accounts = await AmazonAccount.find({ userId: req.user.id }).sort({ createdAt: 1 });
    const results = [];
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      try {
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
        results.push({ accountId: account._id, amount, currency, index: i + 1, total: accounts.length, timestamp: snap.createdAt });
      } catch (err) {
        results.push({ accountId: account._id, error: err?.message || 'Refresh failed', index: i + 1, total: accounts.length });
      }
    }
    res.json({ results });
  } catch (e) {
    next(e);
  }
});

export default router;

