import Payment from "../../models/Payment.js";
import Order from "../../models/Order.js";
import { ApiError } from "../../utils/ApiError.js";
import { emitEvent } from "../../events/eventBus.js";
import {
  initSslcommerzSession,
  validateSslcommerzTransaction,
} from "./sslcommerz.gateway.js";
import { createBkashPayment, executeBkashPayment } from "./bkash.gateway.js";

export const initiatePayment = async ({ orderId, customer }) => {
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found.");
  if (order.paymentStatus === "paid")
    throw new ApiError(400, "This order is already paid.");

  if (order.paymentMethod === "cod") {
    const payment = await Payment.create({
      order: order._id,
      customer: customer._id,
      gateway: "cod",
      amount: order.total,
      status: "pending",
    });
    return { payment, redirectUrl: null };
  }

  if (order.paymentMethod === "sslcommerz") {
    const { gatewayUrl, sessionKey } = await initSslcommerzSession({
      order,
      customer,
    });
    const payment = await Payment.create({
      order: order._id,
      customer: customer._id,
      gateway: "sslcommerz",
      gatewaySessionId: sessionKey,
      amount: order.total,
      status: "initiated",
    });
    return { payment, redirectUrl: gatewayUrl };
  }

  if (order.paymentMethod === "bkash") {
    const { gatewayUrl, paymentID } = await createBkashPayment({ order });
    const payment = await Payment.create({
      order: order._id,
      customer: customer._id,
      gateway: "bkash",
      gatewaySessionId: paymentID,
      amount: order.total,
      status: "initiated",
    });
    return { payment, redirectUrl: gatewayUrl };
  }

  throw new ApiError(
    400,
    `Payment method "${order.paymentMethod}" is not yet wired up.`
  );
};

const markOrderPaid = async ({ order, payment, note }) => {
  order.paymentStatus = "paid";
  order.status = "confirmed";
  order.statusHistory.push({ status: "confirmed", note });
  await order.save();
  emitEvent("payment:success", { order, payment });
};

export const handleSslcommerzCallback = async ({
  tran_id,
  val_id,
  status,
  amount,
}) => {
  const order = await Order.findOne({ orderNumber: tran_id });
  if (!order) throw new ApiError(404, "Order not found for this transaction.");

  const payment = await Payment.findOne({
    order: order._id,
    gateway: "sslcommerz",
  });
  if (!payment) throw new ApiError(404, "Payment record not found.");

  if (status !== "success") {
    payment.status = status === "cancel" ? "cancelled" : "failed";
    await payment.save();
    return { order, payment };
  }

  const validation = await validateSslcommerzTransaction(val_id);
  const isValid =
    ["VALID", "VALIDATED"].includes(validation.status) &&
    Number(validation.amount) === Number(order.total);

  if (!isValid) {
    payment.status = "failed";
    payment.gatewayResponse = validation;
    await payment.save();
    throw new ApiError(400, "Payment could not be verified.");
  }

  payment.status = "success";
  payment.transactionId = validation.bank_tran_id || val_id;
  payment.gatewayResponse = validation;
  payment.verifiedAt = new Date();
  await payment.save();

  await markOrderPaid({
    order,
    payment,
    note: "Payment verified via SSLCommerz",
  });

  return { order, payment };
};

export const handleBkashCallback = async ({ paymentID, status }) => {
  const payment = await Payment.findOne({
    gatewaySessionId: paymentID,
    gateway: "bkash",
  });
  if (!payment) throw new ApiError(404, "Payment record not found.");

  const order = await Order.findById(payment.order);
  if (!order) throw new ApiError(404, "Order not found for this payment.");

  if (status !== "success") {
    payment.status = status === "cancel" ? "cancelled" : "failed";
    await payment.save();
    return { order, payment };
  }

  const result = await executeBkashPayment(paymentID);
  const isValid =
    result.transactionStatus === "Completed" &&
    Number(result.amount) === Number(order.total);

  if (!isValid) {
    payment.status = "failed";
    payment.gatewayResponse = result;
    await payment.save();
    throw new ApiError(400, "Payment could not be verified.");
  }

  payment.status = "success";
  payment.transactionId = result.trxID;
  payment.gatewayResponse = result;
  payment.verifiedAt = new Date();
  await payment.save();

  await markOrderPaid({ order, payment, note: "Payment verified via bKash" });

  return { order, payment };
};
