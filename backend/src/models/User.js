import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    baseCurrency: { type: String, default: "INR" },
    exchangeRates: {
      // Map currency code -> number rate relative to baseCurrency (1.0 for base)
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

export default mongoose.model("User", userSchema);

