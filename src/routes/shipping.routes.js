import { Router } from "express";
import * as shippingController from "../controllers/shipping.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import { withActivityLog } from "../middleware/activityLogger.js";

const router = Router();
const shippingStaff = authorize("admin", "super_admin", "finance");

// Public — checkout needs this without requiring login (guest checkout).
router.get("/", shippingController.getActiveZones);

router.get("/admin", protect, shippingStaff, shippingController.getAllZones);
router.post(
  "/",
  protect,
  shippingStaff,
  withActivityLog("shipping.createZone", () => ({ entityType: "ShippingZone" })),
  shippingController.createZone
);
router.patch(
  "/:id",
  protect,
  shippingStaff,
  withActivityLog("shipping.updateZone", (req) => ({
    entityType: "ShippingZone",
    entityId: req.params.id,
    metadata: { charge: req.body.charge },
  })),
  shippingController.updateZone
);
router.delete("/:id", protect, shippingStaff, shippingController.deleteZone);

export default router;