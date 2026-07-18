import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { toCsv, sendCsv } from "../utils/csv.js";
import Product from "../models/Product.js";

export const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    category,
    brand,
    search,
    minPrice,
    maxPrice,
    sort,
    hotSale,
    newArrival,
    flashSale,
  } = req.query;

  const filter = { isActive: true };
  if (category) filter.category = category;
  if (brand) filter.brand = brand;
  if (search) filter.$text = { $search: search };
  if (hotSale === "true") filter.isHotSale = true;
  if (newArrival === "true") filter.isNewArrival = true;
  if (flashSale === "true") filter.isFlashSale = true;
  if (minPrice || maxPrice) {
    filter.basePrice = {};
    if (minPrice) filter.basePrice.$gte = Number(minPrice);
    if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
  }

  const sortMap = {
    priceAsc: { basePrice: 1 },
    priceDesc: { basePrice: -1 },
    newest: { createdAt: -1 },
    rating: { ratingsAverage: -1 },
  };

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .populate("brand", "name slug")
      .sort(sortMap[sort] || { createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: products,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { slug: req.params.slug, isActive: true },
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate("category", "name slug")
    .populate("brand", "name slug")
    .populate(
      "relatedProducts",
      "title slug basePrice offerPrice specialPrice oldPrice baseImage images"
    );

  if (!product) throw new ApiError(404, "Product not found.");
  res.status(200).json({ success: true, data: product });
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) throw new ApiError(404, "Product not found.");
  res.status(200).json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!product) throw new ApiError(404, "Product not found.");
  res.status(200).json({ success: true, message: "Product deactivated." });
});

export const exportProducts = asyncHandler(async (req, res) => {
  const products = await Product.find()
    .populate("category", "name")
    .populate("brand", "name")
    .sort({ title: 1 });

  const csv = toCsv(products, [
    { label: "Title", key: "title" },
    { label: "Slug", key: "slug" },
    { label: "Category", get: (p) => p.category?.name || "" },
    { label: "Brand", get: (p) => p.brand?.name || "" },
    { label: "Old Price", key: "oldPrice" },
    { label: "Base Price", key: "basePrice" },
    { label: "Offer Price", key: "offerPrice" },
    { label: "Special Price", key: "specialPrice" },
    {
      label: "Effective Price",
      get: (p) => p.specialPrice ?? p.offerPrice ?? p.basePrice,
    },
    {
      label: "Stock",
      get: (p) =>
        p.hasVariants
          ? p.variants.reduce((sum, v) => sum + v.stock, 0)
          : p.stock,
    },
    { label: "Has Variants", get: (p) => (p.hasVariants ? "Yes" : "No") },
    { label: "Views", key: "views" },
    { label: "Ratings Avg", key: "ratingsAverage" },
    { label: "Ratings Count", key: "ratingsCount" },
    { label: "Active", get: (p) => (p.isActive ? "Yes" : "No") },
    { label: "Hot Sale", get: (p) => (p.isHotSale ? "Yes" : "No") },
    { label: "New Arrival", get: (p) => (p.isNewArrival ? "Yes" : "No") },
    { label: "Flash Sale", get: (p) => (p.isFlashSale ? "Yes" : "No") },
  ]);

  sendCsv(res, `products-${new Date().toISOString().slice(0, 10)}.csv`, csv);
});
