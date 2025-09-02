import mongoose from "mongoose";

const electricityServiceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    label: { type: String, trim: true },
    serviceNumber: { type: String, required: true, trim: true },
    customerName: { type: String },
    lastBillDate: { type: Date },
    lastDueDate: { type: Date },
    lastAmountDue: { type: Number },
    lastBilledUnits: { type: Number },
    lastThreeAmounts: { type: [
      new mongoose.Schema({
        closingDate: Date,
        billAmount: Number,
      }, { _id:false })
    ], default: [] },
    lastStatus: { type: String, enum: ["DUE", "PAID", "NO_DUES", "UNKNOWN"], default: "UNKNOWN" },
    lastFetchedAt: { type: Date },
    lastError: { type: String },
    // Cooldown and locking
    refreshInProgress: { type: Boolean, default: false },
    nextAllowedAt: { type: Date },
    // Soft delete
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

electricityServiceSchema.index({ userId: 1, serviceNumber: 1 }, { unique: true });

export default mongoose.model("ElectricityService", electricityServiceSchema);

