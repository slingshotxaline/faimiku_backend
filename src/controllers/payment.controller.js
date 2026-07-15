import { asyncHandler } from "../utils/asyncHandler.js";
import * as paymentService from "../services/payment/payment.service.js";

export const initiatePayment = asyncHandler(async (req, res) => {
  const { payment, redirectUrl } = await paymentService.initiatePayment({
    orderId: req.body.orderId,
    customer: req.user,
  });
  res.status(200).json({ success: true, data: { payment, redirectUrl } });
});

// SSLCommerz posts back as x-www-form-urlencoded to success/fail/cancel URLs
export const sslcommerzCallback = asyncHandler(async (req, res) => {
  const status = req.query.status; // success | fail | cancel
  const { tran_id, val_id, amount } = req.body;

  const { order } = await paymentService.handleSslcommerzCallback({ tran_id, val_id, status, amount });

  const redirectBase = process.env.CLIENT_URL;
  const outcome = status === "success" ? "success" : status;
  res.redirect(`${redirectBase}/orders/${order._id}?payment=${outcome}`);
});
