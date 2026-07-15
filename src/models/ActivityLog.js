import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true }, // e.g. "login", "product.update", "order.cancel"
    entityType: String, // e.g. "Product", "Order", "Coupon"
    entityId: { type: mongoose.Schema.Types.ObjectId },
    ipAddress: String,
    userAgent: String,
    metadata: mongoose.Schema.Types.Mixed, // before/after diffs, extra context
  },
  { timestamps: true }
);

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.model("ActivityLog", activityLogSchema);
