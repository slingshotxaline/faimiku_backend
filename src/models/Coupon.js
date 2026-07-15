import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: {
      type: String,
      enum: ["percentage", "fixed", "buy_x_get_y", "category", "product", "first_order", "vip", "festival"],
      required: true,
    },
    value: { type: Number, required: true }, // percentage (0-100) or fixed amount
    appliesTo: {
      categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
      products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    },
    buyXGetY: {
      buyQuantity: Number,
      getQuantity: Number,
      getProduct: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    },
    minPurchase: { type: Number, default: 0 },
    maxDiscount: Number, // cap for percentage coupons
    usageLimit: Number, // total redemptions allowed, null = unlimited
    usageCount: { type: Number, default: 0 },
    userLimit: { type: Number, default: 1 }, // uses per customer
    usedBy: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, count: Number }],
    startsAt: Date,
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);



export default mongoose.model("Coupon", couponSchema);
