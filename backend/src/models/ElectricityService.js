import mongoose from "mongoose";

const electricityServiceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    serviceNumber: { type: String, required: true, trim: true },
    customerName: { type: String },
    lastBillDate: { type: Date },
    lastDueDate: { type: Date },
    lastAmountDue: { type: Number },
    lastStatus: { type: String, enum: ["DUE", "PAID", "NO_DUES", "UNKNOWN"], default: "UNKNOWN" },
    lastFetchedAt: { type: Date },
    lastError: { type: String },
  },
  { timestamps: true }
);

electricityServiceSchema.index({ userId: 1, serviceNumber: 1 }, { unique: true });

export default mongoose.model("ElectricityService", electricityServiceSchema);

