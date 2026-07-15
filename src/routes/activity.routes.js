import { Router } from "express";
import * as activityController from "../controllers/activity.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/", protect, authorize("admin", "super_admin"), activityController.getActivityLogs);

export default router;
