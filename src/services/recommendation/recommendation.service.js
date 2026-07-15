import Order from "../../models/Order.js";
import Product from "../../models/Product.js";

// "Frequently bought together": products that co-occur with `productId` across
// paid orders, ranked by co-occurrence count.
export const getFrequentlyBoughtTogether = async (productId, limit = 4) => {
  const results = await Order.aggregate([
    { $match: { paymentStatus: "paid", "items.product": productId } },
    { $unwind: "$items" },
    { $match: { "items.product": { $ne: productId } } },
    { $group: { _id: "$items.product", coOccurrence: { $sum: 1 } } },
    { $sort: { coOccurrence: -1 } },
    { $limit: limit },
    { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
    { $unwind: "$product" },
    { $match: { "product.isActive": true } },
    { $project: { _id: "$product._id", title: "$product.title", slug: "$product.slug", basePrice: "$product.basePrice", images: "$product.images" } },
  ]);
  return results;
};

// "Similar products": same category, excluding the product itself, ranked by rating
export const getSimilarProducts = async (product, limit = 8) =>
  Product.find({ category: product.category, _id: { $ne: product._id }, isActive: true })
    .sort({ ratingsAverage: -1 })
    .limit(limit)
    .select("title slug basePrice images ratingsAverage");

// "Recommended for you": based on categories the customer has actually bought from
export const getRecommendedForCustomer = async (customerId, limit = 8) => {
  const orders = await Order.find({ customer: customerId, paymentStatus: "paid" }).populate("items.product", "category");
  const categoryIds = [...new Set(
    orders.flatMap((o) => o.items.map((i) => i.category?.toString()).filter(Boolean))
  )];

  if (!categoryIds.length) {
    // No purchase history yet — fall back to trending
    return Product.find({ isActive: true }).sort({ ratingsCount: -1 }).limit(limit).select("title slug basePrice images");
  }

  const purchasedProductIds = orders.flatMap((o) => o.items.map((i) => i.product?._id?.toString()));

  return Product.find({
    category: { $in: categoryIds },
    _id: { $nin: purchasedProductIds },
    isActive: true,
  })
    .sort({ ratingsAverage: -1 })
    .limit(limit)
    .select("title slug basePrice images ratingsAverage");
};

// "Trending": most units sold in the last 14 days
export const getTrendingProducts = async (limit = 8) => {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const results = await Order.aggregate([
    { $match: { paymentStatus: "paid", createdAt: { $gte: since } } },
    { $unwind: "$items" },
    { $group: { _id: "$items.product", unitsSold: { $sum: "$items.quantity" } } },
    { $sort: { unitsSold: -1 } },
    { $limit: limit },
    { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
    { $unwind: "$product" },
    { $match: { "product.isActive": true } },
    { $project: { _id: "$product._id", title: "$product.title", slug: "$product.slug", basePrice: "$product.basePrice", images: "$product.images" } },
  ]);
  return results;
};
