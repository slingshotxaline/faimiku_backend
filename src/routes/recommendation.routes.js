import { Router } from "express";
import * as recommendationController from "../controllers/recommendation.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/trending", recommendationController.getTrending);
router.get("/for-me", protect, recommendationController.getRecommendedForMe);
router.get("/:productId/similar", recommendationController.getSimilarProducts);
router.get("/:productId/frequently-bought-together", recommendationController.getFrequentlyBoughtTogether);

export default router;
