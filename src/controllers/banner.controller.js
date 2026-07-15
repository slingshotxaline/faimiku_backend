import { asyncHandler } from "../utils/asyncHandler.js";
import Banner from "../models/Banner.js";

export const getActiveBanners = asyncHandler(async (req, res) => {
  const now = new Date();
  const filter = {
    isActive: true,
    ...(req.query.placement && { placement: req.query.placement }),
    $or: [{ startsAt: null }, { startsAt: { $lte: now } }],
  };
  const banners = await Banner.find(filter).sort({ sortOrder: 1 });
  // filter endsAt in JS since $or above already used for startsAt
  res.status(200).json({
    success: true,
    data: banners.filter((b) => !b.endsAt || b.endsAt >= now),
  });
});

export const listBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find().sort({ sortOrder: 1 });
  res.status(200).json({ success: true, data: banners });
});

export const createBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.create(req.body);
  res.status(201).json({ success: true, data: banner });
});

export const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: banner });
});

export const deleteBanner = asyncHandler(async (req, res) => {
  await Banner.findByIdAndUpdate(req.params.id, { isActive: false });
  res.status(200).json({ success: true, message: "Banner deactivated." });
});
