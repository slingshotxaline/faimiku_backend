import { Router } from "express";
import * as bannerController from "../controllers/banner.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();
const cmsStaff = authorize("admin", "super_admin", "marketing");

router.get("/active", bannerController.getActiveBanners);
router.get("/", protect, cmsStaff, bannerController.listBanners);
router.post("/", protect, cmsStaff, bannerController.createBanner);
router.patch("/:id", protect, cmsStaff, bannerController.updateBanner);
router.delete("/:id", protect, cmsStaff, bannerController.deleteBanner);

export default router;
