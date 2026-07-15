import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "new_order", "payment_success", "refund", "low_stock",
        "product_review", "new_customer", "order_status_changed",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: String,
    audience: { type: String, enum: ["admin", "customer"], required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // set when audience === "customer"
    reference: { type: mongoose.Schema.Types.ObjectId },
    referenceModel: { type: String }, // e.g. "Order", "Product"
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ audience: 1, recipient: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
