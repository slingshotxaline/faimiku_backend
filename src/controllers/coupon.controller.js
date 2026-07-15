import { asyncHandler } from "../utils/asyncHandler.js";
import Coupon from "../models/Coupon.js";
import { validateCoupon } from "../services/coupon/coupon.service.js";

// Lets the frontend show the discount at checkout before the order is placed
export const checkCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal, items } = req.body;
  const { discount, coupon } = await validateCoupon({
    code,
    customerId: req.user._id,
    subtotal,
    items,
  });
  res.status(200).json({ success: true, data: { discount, type: coupon.type } });
});

export const listCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: coupons });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, data: coupon });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ success: true, data: coupon });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  await Coupon.findByIdAndUpdate(req.params.id, { isActive: false });
  res.status(200).json({ success: true, message: "Coupon deactivated." });
});
