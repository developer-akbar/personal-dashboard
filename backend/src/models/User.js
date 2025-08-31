import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    username: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    phone: { type: String },
    avatarUrl: { type: String },
    baseCurrency: { type: String, default: "INR" },
    exchangeRates: {
      // Map currency code -> number rate relative to baseCurrency (1.0 for base)
      type: Map,
      of: Number,
      default: {},
    },
    refreshSchedule: { type: String, enum: ['off','daily','weekly'], default: 'off' },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

export default mongoose.model("User", userSchema);

