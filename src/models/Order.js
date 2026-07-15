import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    title: String,
    sku: String,
    image: String,
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: String,
      phone: String,
      street: String,
      city: String,
      district: String,
      postalCode: String,
      country: String,
    },
    subtotal: { type: Number, required: true },
    shippingZone: { type: mongoose.Schema.Types.ObjectId, ref: "ShippingZone" },
    shippingZoneName: String,
    shippingCost: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", default: null },
    paymentMethod: {
      type: String,
      enum: ["sslcommerz", "bkash", "nagad", "rocket", "card", "cod"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    status: {
      type: String,
      enum: [
        "pending", "confirmed", "packed", "shipped", "out_for_delivery",
        "delivered", "completed", "cancelled", "returned", "refunded", "failed",
      ],
      default: "pending",
    },
    statusHistory: [
      { status: String, note: String, changedAt: { type: Date, default: Date.now } },
    ],
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
