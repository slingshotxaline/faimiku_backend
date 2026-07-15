import { Router } from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.get(
  "/admin",
  protect,
  authorize("admin", "super_admin", "warehouse", "marketing", "finance", "support"),
  notificationController.getAdminNotifications
);
router.patch("/:id/read", protect, notificationController.markAsRead);

export default router;
