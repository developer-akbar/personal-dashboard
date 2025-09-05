import dotenv from "dotenv";
dotenv.config();

// Force Playwright to use browsers from node_modules cache at runtime
if (!process.env.PLAYWRIGHT_BROWSERS_PATH) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = "0";
}

import http from "http";
import app from "./app.js";
import { connectToDatabase } from "./config/db.js";

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await connectToDatabase();
  } catch (error) {
    console.log("Database connection failed, continuing without database:", error.message);
  }

  const server = http.createServer(app);

  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[backend] Server listening on port ${PORT}`);
  });
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server", error);
  process.exit(1);
});

