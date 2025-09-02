import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

const router = Router();

async function verifyTurnstile(token) {
  try{
    const secret = process.env.TURNSTILE_SECRET
    if (!secret) return true // if not configured, skip
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token || '' }).toString()
    })
    const json = await r.json()
    return !!json.success
  }catch{ return false }
}

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, username, phone, avatarUrl, captchaToken } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const okCaptcha = await verifyTurnstile(captchaToken)
    if (!okCaptcha) return res.status(400).json({ error: 'Captcha verification failed' })

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, username, phone, avatarUrl, passwordHash });

    const access = signAccessToken({ sub: String(user._id), email: user.email, name: user.name });
    const refresh = signRefreshToken({ sub: String(user._id), email: user.email, name: user.name });
    res.json({ accessToken: access, refreshToken: refresh, user: { id: user._id, email: user.email, name: user.name, username: user.username, phone: user.phone, avatarUrl: user.avatarUrl } });
  } catch (e) {
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password, captchaToken } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const okCaptcha = await verifyTurnstile(captchaToken)
    if (!okCaptcha) return res.status(400).json({ error: 'Captcha verification failed' })
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const access = signAccessToken({ sub: String(user._id), email: user.email, name: user.name });
    const refresh = signRefreshToken({ sub: String(user._id), email: user.email, name: user.name });
    res.json({ accessToken: access, refreshToken: refresh, user: { id: user._id, email: user.email, name: user.name, username: user.username, phone: user.phone, avatarUrl: user.avatarUrl } });
  } catch (e) {
    next(e);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ error: "refreshToken required" });
    const payload = verifyRefreshToken(refreshToken);
    const access = signAccessToken({ sub: payload.sub, email: payload.email });
    res.json({ accessToken: access });
  } catch (e) {
    next(e);
  }
});

export default router;

