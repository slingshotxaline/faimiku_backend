import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    gateway: {
      type: String,
      enum: ["sslcommerz", "bkash", "nagad", "rocket", "card", "cod"],
      required: true,
    },
    transactionId: { type: String, unique: true, sparse: true },
    gatewaySessionId: String,
    amount: { type: Number, required: true },
    currency: { type: String, default: "BDT" },
    status: {
      type: String,
      enum: ["initiated", "pending", "success", "failed", "cancelled", "refunded"],
      default: "initiated",
    },
    gatewayResponse: mongoose.Schema.Types.Mixed, // raw callback payload, for auditing
    verifiedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
