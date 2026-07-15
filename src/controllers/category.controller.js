import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import Category from "../models/Category.js";

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({
    sortOrder: 1,
  });
  res.status(200).json({ success: true, data: categories });
});

export const listAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ sortOrder: 1 });
  res.status(200).json({ success: true, data: categories });
});

export const createCategory = asyncHandler(async (req, res) => {
  const existing = await Category.findOne({ slug: req.body.slug });
  if (existing)
    throw new ApiError(409, "A category with this slug already exists.");
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, data: category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) throw new ApiError(404, "Category not found.");
  res.status(200).json({ success: true, data: category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!category) throw new ApiError(404, "Category not found.");
  res.status(200).json({ success: true, message: "Category deactivated." });
});
