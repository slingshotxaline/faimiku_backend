import { Router } from "express";
import * as couponController from "../controllers/coupon.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import { withActivityLog } from "../middleware/activityLogger.js";

const router = Router();
const marketingStaff = authorize("admin", "super_admin", "marketing");

router.post("/check", protect, couponController.checkCoupon);
router.get("/", protect, marketingStaff, couponController.listCoupons);
router.post(
  "/",
  protect,
  marketingStaff,
  withActivityLog("coupon.create", () => ({ entityType: "Coupon" })),
  couponController.createCoupon
);
router.patch(
  "/:id",
  protect,
  marketingStaff,
  withActivityLog("coupon.update", (req) => ({ entityType: "Coupon", entityId: req.params.id })),
  couponController.updateCoupon
);
router.delete(
  "/:id",
  protect,
  marketingStaff,
  withActivityLog("coupon.deactivate", (req) => ({ entityType: "Coupon", entityId: req.params.id })),
  couponController.deleteCoupon
);

export default router;
