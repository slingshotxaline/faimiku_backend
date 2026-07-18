// backend/src/controllers/payment.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import * as paymentService from "../services/payment/payment.service.js";

export const initiatePayment = asyncHandler(async (req, res) => {
  const { payment, redirectUrl } = await paymentService.initiatePayment({
    orderId: req.body.orderId,
    customer: req.user,
  });
  res.status(200).json({ success: true, data: { payment, redirectUrl } });
});

export const sslcommerzCallback = asyncHandler(async (req, res) => {
  const status = req.query.status;
  const { tran_id, val_id, amount } = req.body;

  const { order } = await paymentService.handleSslcommerzCallback({
    tran_id,
    val_id,
    status,
    amount,
  });

  const redirectBase = process.env.CLIENT_URL;
  const outcome = status === "success" ? "success" : status;
  res.redirect(`${redirectBase}/orders/${order._id}?payment=${outcome}`);
});

export const bkashCallback = asyncHandler(async (req, res) => {
  const { paymentID, status } = req.query;

  const { order } = await paymentService.handleBkashCallback({
    paymentID,
    status:
      status === "success"
        ? "success"
        : status === "cancel"
        ? "cancel"
        : "failure",
  });

  const redirectBase = process.env.CLIENT_URL;
  res.redirect(
    `${redirectBase}/orders/${order._id}?payment=${
      status === "success" ? "success" : status
    }`
  );
});
