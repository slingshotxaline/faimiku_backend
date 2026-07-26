import { Router } from "express";
import * as analyticsController from "../controllers/analytics.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();
const adminOnly = authorize("admin", "super_admin", "finance", "marketing");

router.get("/summary", protect, adminOnly, analyticsController.getSummary);
router.get("/sales", protect, adminOnly, analyticsController.getSalesAnalytics);
router.get(
  "/customers",
  protect,
  adminOnly,
  analyticsController.getCustomerAnalytics
);
router.get(
  "/products",
  protect,
  adminOnly,
  analyticsController.getProductAnalytics
);
router.get(
  "/traffic/summary",
  protect,
  adminOnly,
  analyticsController.getTrafficSummary
);
router.get(
  "/traffic/daily",
  protect,
  adminOnly,
  analyticsController.getDailyTraffic
);
router.get(
  "/traffic/top-pages",
  protect,
  adminOnly,
  analyticsController.getTopPages
);
router.get(
  "/traffic/top-clicks",
  protect,
  adminOnly,
  analyticsController.getTopClicks
);
router.get(
  "/traffic/devices",
  protect,
  adminOnly,
  analyticsController.getDeviceBreakdown
);
router.get("/traffic/log", protect, adminOnly, analyticsController.getEventLog);

export default router;
