import Review from "../../models/Review.js";
import Order from "../../models/Order.js";
import Product from "../../models/Product.js";
import { ApiError } from "../../utils/ApiError.js";

// Recalculates the product's aggregate rating whenever a review is added/changed/removed
const recalculateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId, status: "approved" } },
    { $group: { _id: "$product", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const { avg = 0, count = 0 } = stats[0] || {};
  await Product.findByIdAndUpdate(productId, {
    ratingsAverage: Math.round(avg * 10) / 10,
    ratingsCount: count,
  });
};

export const createReview = async ({ productId, customerId, rating, title, comment, images }) => {
  const existing = await Review.findOne({ product: productId, customer: customerId });
  if (existing) throw new ApiError(409, "You have already reviewed this product.");

  // A review is "verified" if the customer has a delivered/completed order containing this product
  const verifyingOrder = await Order.findOne({
    customer: customerId,
    status: { $in: ["delivered", "completed"] },
    "items.product": productId,
  });

  const review = await Review.create({
    product: productId,
    customer: customerId,
    order: verifyingOrder?._id,
    rating,
    title,
    comment,
    images,
    isVerifiedPurchase: !!verifyingOrder,
  });

  await recalculateProductRating(productId);
  return review;
};

export const getProductReviews = (productId, { page = 1, limit = 10 } = {}) =>
  Review.find({ product: productId, status: "approved" })
    .populate("customer", "name")
    .sort({ helpfulVotes: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

export const voteHelpful = async (reviewId, userId) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, "Review not found.");
  if (review.votedBy.some((id) => String(id) === String(userId))) {
    throw new ApiError(400, "You already voted on this review.");
  }
  review.helpfulVotes += 1;
  review.votedBy.push(userId);
  await review.save();
  return review;
};

export const deleteReview = async (reviewId, customerId) => {
  const review = await Review.findOneAndDelete({ _id: reviewId, customer: customerId });
  if (!review) throw new ApiError(404, "Review not found.");
  await recalculateProductRating(review.product);
};
