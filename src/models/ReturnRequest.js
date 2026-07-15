import mongoose from "mongoose";

const returnItemSchema = new mongoose.Schema(
  {
    orderItemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    reason: { type: String, required: true },
  },
  { _id: false }
);

const returnRequestSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [returnItemSchema],
    reason: { type: String, required: true },
    images: [{ url: String, publicId: String }],
    status: {
      type: String,
      enum: [
        "requested", "admin_review", "approved", "pickup_scheduled",
        "picked_up", "inspecting", "refunded", "rejected", "completed",
      ],
      default: "requested",
    },
    statusHistory: [
      { status: String, note: String, changedAt: { type: Date, default: Date.now } },
    ],
    refundAmount: Number,
    adminNote: String,
  },
  { timestamps: true }
);

export default mongoose.model("ReturnRequest", returnRequestSchema);
