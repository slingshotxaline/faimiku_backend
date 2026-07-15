import { Router } from "express";
import * as pageController from "../controllers/page.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();
const cmsStaff = authorize("admin", "super_admin", "marketing");

router.get("/:slug", pageController.getPageBySlug);
router.get("/", protect, cmsStaff, pageController.listPages);
router.put("/", protect, cmsStaff, pageController.upsertPage);
router.delete("/:id", protect, cmsStaff, pageController.deletePage);

export default router;
