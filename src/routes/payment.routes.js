// backend/src/routes/payment.routes.js
import { Router } from "express";
import * as paymentController from "../controllers/payment.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/initiate", protect, paymentController.initiatePayment);
router.post("/sslcommerz/callback", paymentController.sslcommerzCallback);
router.get("/bkash/callback", paymentController.bkashCallback);

export default router;
