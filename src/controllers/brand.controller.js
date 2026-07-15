import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import Brand from "../models/Brand.js";

export const getBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find({ isActive: true }).sort({ name: 1 });
  res.status(200).json({ success: true, data: brands });
});

export const listAllBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find().sort({ name: 1 });
  res.status(200).json({ success: true, data: brands });
});

export const createBrand = asyncHandler(async (req, res) => {
  const existing = await Brand.findOne({ slug: req.body.slug });
  if (existing)
    throw new ApiError(409, "A brand with this slug already exists.");
  const brand = await Brand.create(req.body);
  res.status(201).json({ success: true, data: brand });
});

export const updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!brand) throw new ApiError(404, "Brand not found.");
  res.status(200).json({ success: true, data: brand });
});

export const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!brand) throw new ApiError(404, "Brand not found.");
  res.status(200).json({ success: true, message: "Brand deactivated." });
});
