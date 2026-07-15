import { Router } from "express";
import * as inventoryController from "../controllers/inventory.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import { withActivityLog } from "../middleware/activityLogger.js";

const router = Router();
const warehouseStaff = authorize("admin", "super_admin", "warehouse");

router.get("/", protect, warehouseStaff, inventoryController.getInventoryOverview);
router.get("/:productId/history", protect, warehouseStaff, inventoryController.getProductHistory);
router.post(
  "/adjust",
  protect,
  warehouseStaff,
  withActivityLog("inventory.adjust", (req) => ({
    entityType: "Product",
    entityId: req.body.productId,
    metadata: { type: req.body.type, quantityChange: req.body.quantityChange, reason: req.body.reason },
  })),
  inventoryController.adjustStock
);

export default router;