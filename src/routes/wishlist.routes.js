import { Router } from "express";
import * as wishlistController from "../controllers/wishlist.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/", protect, wishlistController.getWishlist);
router.post("/:productId", protect, wishlistController.addToWishlist);
router.delete("/:productId", protect, wishlistController.removeFromWishlist);

export default router;
