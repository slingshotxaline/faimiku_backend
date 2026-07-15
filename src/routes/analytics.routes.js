import { Router } from "express";
import * as analyticsController from "../controllers/analytics.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();
const adminOnly = authorize("admin", "super_admin", "finance", "marketing");

router.get("/summary", protect, adminOnly, analyticsController.getSummary);
router.get("/sales", protect, adminOnly, analyticsController.getSalesAnalytics);
router.get("/customers", protect, adminOnly, analyticsController.getCustomerAnalytics);
router.get("/products", protect, adminOnly, analyticsController.getProductAnalytics);

export default router;
