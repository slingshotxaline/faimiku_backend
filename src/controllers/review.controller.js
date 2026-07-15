import { asyncHandler } from "../utils/asyncHandler.js";
import * as reviewService from "../services/review/review.service.js";

export const createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview({
    productId: req.params.productId,
    customerId: req.user._id,
    rating: req.body.rating,
    title: req.body.title,
    comment: req.body.comment,
    images: req.body.images,
  });
  res.status(201).json({ success: true, data: review });
});

export const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewService.getProductReviews(req.params.productId, req.query);
  res.status(200).json({ success: true, data: reviews });
});

export const voteHelpful = asyncHandler(async (req, res) => {
  const review = await reviewService.voteHelpful(req.params.reviewId, req.user._id);
  res.status(200).json({ success: true, data: review });
});

export const deleteReview = asyncHandler(async (req, res) => {
  await reviewService.deleteReview(req.params.reviewId, req.user._id);
  res.status(200).json({ success: true, message: "Review deleted." });
});
