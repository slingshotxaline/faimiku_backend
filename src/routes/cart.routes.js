import { Router } from "express";
import * as cartController from "../controllers/cart.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.put("/sync", protect, cartController.syncCart);
router.delete("/", protect, cartController.clearServerCart);

export default router;
