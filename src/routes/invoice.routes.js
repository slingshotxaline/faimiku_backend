// backend/src/routes/invoice.routes.js
import { Router } from "express";
import * as invoiceController from "../controllers/invoice.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();
const warehouseStaff = authorize("admin", "super_admin", "warehouse", "finance");

router.get(
  "/:orderId/packing-slip",
  protect,
  warehouseStaff,
  invoiceController.downloadPackingSlip
);
router.get("/:orderId", protect, invoiceController.downloadInvoice);

export default router;