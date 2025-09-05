import mongoose from "mongoose";

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) return;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log("MONGODB_URI not set, skipping database connection for testing");
    return;
  }

  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB_NAME || "amazon_wallet_monitor",
    });
    isConnected = true;
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log("Failed to connect to MongoDB, continuing without database:", error.message);
    // Continue without database for testing
  }
}

