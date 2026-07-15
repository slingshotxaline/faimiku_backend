import { onEvent } from "../eventBus.js";
import { getIO } from "../../sockets/index.js";
import User from "../../models/User.js";
import Notification from "../../models/Notification.js";
import logger from "../../utils/logger.js";
import { sendOrderConfirmationEmail, sendShippingUpdateEmail } from "../../services/email/email.service.js";

const notifyAdmins = (event, payload) => {
  const io = getIO();
  if (io) io.to("admins").emit(event, payload);
};

const notifyCustomer = (customerId, event, payload) => {
  const io = getIO();
  if (io) io.to(`customer:${customerId}`).emit(event, payload);
};

onEvent("order:created", async ({ order }) => {
  try {
    await Notification.create({
      type: "new_order",
      title: "New order received",
      message: `Order ${order.orderNumber} — ৳${order.total.toLocaleString()}`,
      audience: "admin",
      reference: order._id,
      referenceModel: "Order",
    });
    notifyAdmins("new_order", { orderId: order._id, orderNumber: order.orderNumber, total: order.total });

    const customer = await User.findById(order.customer);
    if (customer) await sendOrderConfirmationEmail(order, customer.email);
  } catch (err) {
    logger.error(`Notification listener (order:created) error: ${err.message}`);
  }
});

onEvent("order:statusChanged", async ({ order, status }) => {
  try {
    notifyCustomer(order.customer, "order_status_changed", { orderId: order._id, status });

    const customer = await User.findById(order.customer);
    if (customer && ["shipped", "out_for_delivery", "delivered"].includes(status)) {
      await sendShippingUpdateEmail(order, customer.email, status);
    }
  } catch (err) {
    logger.error(`Notification listener (order:statusChanged) error: ${err.message}`);
  }
});

onEvent("payment:success", async ({ order, payment }) => {
  try {
    await Notification.create({
      type: "payment_success",
      title: "Payment received",
      message: `Payment for order ${order.orderNumber} confirmed via ${payment.gateway}`,
      audience: "admin",
      reference: order._id,
      referenceModel: "Order",
    });
    notifyAdmins("payment_success", { orderId: order._id, orderNumber: order.orderNumber });
  } catch (err) {
    logger.error(`Notification listener (payment:success) error: ${err.message}`);
  }
});

onEvent("inventory:lowStock", async ({ product, currentStock }) => {
  try {
    await Notification.create({
      type: "low_stock",
      title: "Low stock alert",
      message: `${product.title} is down to ${currentStock} units`,
      audience: "admin",
      reference: product._id,
      referenceModel: "Product",
    });
    notifyAdmins("low_stock", { productId: product._id, title: product.title, currentStock });
  } catch (err) {
    logger.error(`Notification listener (inventory:lowStock) error: ${err.message}`);
  }
});

onEvent("return:requested", async ({ returnRequest, order }) => {
  try {
    await Notification.create({
      type: "refund",
      title: "New return request",
      message: `Return requested for order ${order.orderNumber}`,
      audience: "admin",
      reference: returnRequest._id,
      referenceModel: "ReturnRequest",
    });
    notifyAdmins("return_requested", { returnId: returnRequest._id, orderNumber: order.orderNumber });
  } catch (err) {
    logger.error(`Notification listener (return:requested) error: ${err.message}`);
  }
});

onEvent("return:statusChanged", async ({ returnRequest, status }) => {
  try {
    notifyCustomer(returnRequest.customer, "return_status_changed", { returnId: returnRequest._id, status });
  } catch (err) {
    logger.error(`Notification listener (return:statusChanged) error: ${err.message}`);
  }
});
