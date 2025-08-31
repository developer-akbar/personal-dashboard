import mongoose from "mongoose";

const amazonAccountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    label: { type: String, required: true },
    email: { type: String, required: true },
    region: { type: String, enum: ["amazon.in"], required: true },
    encryptedPassword: { type: String, required: true },
    lastBalance: { type: Number, default: 0 },
    lastCurrency: { type: String, default: "USD" },
    lastRefreshedAt: { type: Date },
    // Persisted cookies/localStorage to reduce repeated logins and bypass 2FA prompts
    storageState: { type: mongoose.Schema.Types.Mixed },
    order: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    lastError: { type: String },
    lastErrorAt: { type: Date },
    pinned: { type: Boolean, default: false, index: true },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("AmazonAccount", amazonAccountSchema);

