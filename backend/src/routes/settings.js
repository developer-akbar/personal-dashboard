import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ baseCurrency: user.baseCurrency || "USD", exchangeRates: user.exchangeRates || {} });
  } catch (e) {
    next(e);
  }
});

router.put("/", async (req, res, next) => {
  try {
    const { baseCurrency, exchangeRates, refreshSchedule } = req.body || {};
    const update = {};
    if (baseCurrency) update.baseCurrency = baseCurrency;
    if (exchangeRates) update.exchangeRates = exchangeRates;
    if (refreshSchedule) update.refreshSchedule = refreshSchedule;
    await User.updateOne({ _id: req.user.id }, update);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

