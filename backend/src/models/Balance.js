import mongoose from "mongoose";

const balanceSchema = new mongoose.Schema(
  {
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "AmazonAccount", index: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Balance", balanceSchema);

