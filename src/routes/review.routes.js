import { Router } from "express";
import * as reviewController from "../controllers/review.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

router.get("/products/:productId/reviews", reviewController.getProductReviews);
router.post("/products/:productId/reviews", protect, reviewController.createReview);
router.post("/reviews/:reviewId/helpful", protect, reviewController.voteHelpful);
router.delete("/reviews/:reviewId", protect, reviewController.deleteReview);

export default router;
