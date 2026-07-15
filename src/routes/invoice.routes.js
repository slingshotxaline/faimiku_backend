import { Router } from "express";
import * as invoiceController from "../controllers/invoice.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/:orderId", protect, invoiceController.downloadInvoice);

export default router;
