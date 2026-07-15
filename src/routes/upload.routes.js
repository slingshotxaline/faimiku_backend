import { Router } from "express";
import * as uploadController from "../controllers/upload.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.post(
  "/image",
  protect,
  authorize("admin", "super_admin", "marketing", "customer"), // customer needed for review image uploads
  uploadController.uploadSingleImage
);

export default router;
