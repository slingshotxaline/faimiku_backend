import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import Product from "../models/Product.js";
import * as recommendationService from "../services/recommendation/recommendation.service.js";

export const getFrequentlyBoughtTogether = asyncHandler(async (req, res) => {
  const data = await recommendationService.getFrequentlyBoughtTogether(req.params.productId);
  res.status(200).json({ success: true, data });
});

export const getSimilarProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId).select("category");
  if (!product) throw new ApiError(404, "Product not found.");
  const data = await recommendationService.getSimilarProducts(product);
  res.status(200).json({ success: true, data });
});

export const getRecommendedForMe = asyncHandler(async (req, res) => {
  const data = await recommendationService.getRecommendedForCustomer(req.user._id);
  res.status(200).json({ success: true, data });
});

export const getTrending = asyncHandler(async (req, res) => {
  const data = await recommendationService.getTrendingProducts();
  res.status(200).json({ success: true, data });
});
