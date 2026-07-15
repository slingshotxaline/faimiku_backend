import { Router } from "express";
import * as paymentController from "../controllers/payment.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/initiate", protect, paymentController.initiatePayment);
// No `protect` here — the gateway calls this server-to-server/browser-redirect,
// not with our JWT. Authenticity is instead verified via validateSslcommerzTransaction.
router.post("/sslcommerz/callback", paymentController.sslcommerzCallback);

export default router;
