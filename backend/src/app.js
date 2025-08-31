import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import compression from "compression";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.js";
import accountRoutes from "./routes/accounts.js";
import balanceRoutes from "./routes/balances.js";
import settingsRoutes from "./routes/settings.js";
import rewardsRoutes from "./routes/rewards.js";
import userRoutes from "./routes/users.js";
import { errorHandler } from "./middleware/error.js";
import mongoose from 'mongoose'

const app = express();

const normalizeOrigin = (s) => (s || "").trim().replace(/\/$/, "");
const rawOrigins = (process.env.CORS_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
const envOrigins = rawOrigins.length ? rawOrigins : ["*"];

function matchesAllowed(origin, allowed) {
  if (allowed === "*") return true;
  const normAllowed = normalizeOrigin(allowed);
  const normOrigin = normalizeOrigin(origin);
  if (normAllowed.includes("*")) {
    // Convert wildcard to RegExp. Example: https://*.vercel.app
    const escaped = normAllowed
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\\\*/g, ".*");
    const re = new RegExp(`^${escaped}$`, "i");
    return re.test(normOrigin);
  }
  return normAllowed.toLowerCase() === normOrigin.toLowerCase();
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const ok = envOrigins.some((allowed) => matchesAllowed(origin, allowed));
    return callback(ok ? null : new Error("Not allowed by CORS"), ok);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  // Do not specify allowedHeaders: let cors reflect Access-Control-Request-Headers
};

app.use(cors(corsOptions));
// Ensure preflight carries proper CORS headers (Express v5-safe)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return cors(corsOptions)(req, res, () => res.sendStatus(204));
  }
  return next();
});

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(morgan("tiny"));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
});
app.use(limiter);

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/api/health", (_req, res) => {
  const db = mongoose.connection?.readyState
  res.json({ ok: true, db: db === 1 ? 'connected' : db === 2 ? 'connecting' : db === 0 ? 'disconnected' : 'unknown' })
});

// Backward-compatible mounts
app.use("/auth", authRoutes);
app.use("/accounts", accountRoutes);
app.use("/balances", balanceRoutes);
app.use("/settings", settingsRoutes);
app.use("/rewards", rewardsRoutes);
app.use("/users", userRoutes);

// API prefix mounts to match frontend baseURL ending with /api
app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/balances", balanceRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/rewards", rewardsRoutes);
app.use("/api/users", userRoutes);

app.use(errorHandler);

export default app;

