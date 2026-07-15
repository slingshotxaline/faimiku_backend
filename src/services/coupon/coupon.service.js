import Coupon from "../../models/Coupon.js";
import { ApiError } from "../../utils/ApiError.js";

// Validates a coupon against a cart and returns the discount amount.
// Does NOT mark it as used — call recordCouponUsage() only after the order is confirmed.
export const validateCoupon = async ({ code, customerId, subtotal, items }) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) throw new ApiError(404, "Coupon not found or inactive.");

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) throw new ApiError(400, "Coupon is not active yet.");
  if (now > coupon.expiresAt) throw new ApiError(400, "Coupon has expired.");

  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
    throw new ApiError(400, "Coupon usage limit reached.");
  }

  const customerUsage = coupon.usedBy.find((u) => String(u.user) === String(customerId));
  if (customerUsage && customerUsage.count >= coupon.userLimit) {
    throw new ApiError(400, "You have already used this coupon the maximum number of times.");
  }

  if (subtotal < coupon.minPurchase) {
    throw new ApiError(400, `Minimum purchase of ৳${coupon.minPurchase} required for this coupon.`);
  }

  let eligibleTotal = subtotal;
  if (coupon.type === "category" && coupon.appliesTo.categories.length) {
    eligibleTotal = items
      .filter((i) => coupon.appliesTo.categories.some((c) => String(c) === String(i.category)))
      .reduce((sum, i) => sum + i.subtotal, 0);
  }
  if (coupon.type === "product" && coupon.appliesTo.products.length) {
    eligibleTotal = items
      .filter((i) => coupon.appliesTo.products.some((p) => String(p) === String(i.product)))
      .reduce((sum, i) => sum + i.subtotal, 0);
  }

  let discount = 0;
  if (coupon.type === "percentage" || coupon.type === "category" || coupon.type === "product") {
    discount = (eligibleTotal * coupon.value) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else if (coupon.type === "fixed" || coupon.type === "first_order" || coupon.type === "vip" || coupon.type === "festival") {
    discount = Math.min(coupon.value, eligibleTotal);
  }
  // "buy_x_get_y" is handled at the line-item level by the caller, not as a flat discount.

  return { coupon, discount: Math.round(discount * 100) / 100 };
};

export const recordCouponUsage = async (couponId, customerId) => {
  const coupon = await Coupon.findById(couponId);
  coupon.usageCount += 1;

  const entry = coupon.usedBy.find((u) => String(u.user) === String(customerId));
  if (entry) entry.count += 1;
  else coupon.usedBy.push({ user: customerId, count: 1 });

  await coupon.save();
};
