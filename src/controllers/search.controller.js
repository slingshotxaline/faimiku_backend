import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import Product from "../models/Product.js";
import { parseSmartQuery } from "../services/search/smartSearch.service.js";

// Basic search: name/SKU/brand/category via Mongo text index
export const basicSearch = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;
  if (!q) throw new ApiError(400, "Search query is required.");

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    Product.find({ $text: { $search: q }, isActive: true })
      .populate("category", "name slug")
      .populate("brand", "name slug")
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments({ $text: { $search: q }, isActive: true }),
  ]);

  res.status(200).json({
    success: true,
    data: products,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  });
});

// Smart search: "gaming laptop under 100000" -> parsed filters -> query
export const smartSearch = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;
  if (!q) throw new ApiError(400, "Search query is required.");

  const filters = await parseSmartQuery(q);

  const mongoFilter = { isActive: true };
  if (filters.textSearch) mongoFilter.$text = { $search: filters.textSearch };
  if (filters.category) mongoFilter.category = filters.category;
  if (filters.brand) mongoFilter.brand = filters.brand;
  if (filters.minPrice || filters.maxPrice) {
    mongoFilter.basePrice = {};
    if (filters.minPrice) mongoFilter.basePrice.$gte = filters.minPrice;
    if (filters.maxPrice) mongoFilter.basePrice.$lte = filters.maxPrice;
  }
  if (filters.color) mongoFilter.tags = filters.color;

  const sortMap = { priceAsc: { basePrice: 1 }, priceDesc: { basePrice: -1 } };
  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(mongoFilter)
      .populate("category", "name slug")
      .populate("brand", "name slug")
      .sort(sortMap[filters.sort] || {})
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(mongoFilter),
  ]);

  res.status(200).json({
    success: true,
    data: products,
    parsedFilters: filters,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  });
});
