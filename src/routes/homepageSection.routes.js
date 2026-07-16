import { Router } from "express";
import * as homepageSectionController from "../controllers/homepageSection.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import { withActivityLog } from "../middleware/activityLogger.js";

const router = Router();
const cmsStaff = authorize("admin", "super_admin", "marketing");

router.get("/", homepageSectionController.getActiveSections);
router.get(
  "/admin",
  protect,
  cmsStaff,
  homepageSectionController.getAllSections
);
router.post(
  "/",
  protect,
  cmsStaff,
  withActivityLog("homepageSection.create", () => ({
    entityType: "HomepageSection",
  })),
  homepageSectionController.createSection
);
router.patch(
  "/:id",
  protect,
  cmsStaff,
  withActivityLog("homepageSection.update", (req) => ({
    entityType: "HomepageSection",
    entityId: req.params.id,
  })),
  homepageSectionController.updateSection
);
router.delete(
  "/:id",
  protect,
  cmsStaff,
  homepageSectionController.deleteSection
);

export default router;
