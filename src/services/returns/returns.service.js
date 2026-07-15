import ReturnRequest from "../../models/ReturnRequest.js";
import Order from "../../models/Order.js";
import Payment from "../../models/Payment.js";
import Inventory from "../../models/Inventory.js";
import InventoryTransaction from "../../models/InventoryTransaction.js";
import { ApiError } from "../../utils/ApiError.js";
import { emitEvent } from "../../events/eventBus.js";

const RETURNABLE_STATUSES = ["delivered", "completed"];

export const createReturnRequest = async ({ orderId, customerId, items, reason, images }) => {
  const order = await Order.findOne({ _id: orderId, customer: customerId });
  if (!order) throw new ApiError(404, "Order not found.");
  if (!RETURNABLE_STATUSES.includes(order.status)) {
    throw new ApiError(400, "Only delivered or completed orders can be returned.");
  }

  const existing = await ReturnRequest.findOne({ order: orderId, status: { $nin: ["rejected", "completed"] } });
  if (existing) throw new ApiError(409, "A return request is already in progress for this order.");

  const returnRequest = await ReturnRequest.create({
    order: orderId,
    customer: customerId,
    items,
    reason,
    images,
    statusHistory: [{ status: "requested", note: "Return requested by customer" }],
  });

  emitEvent("return:requested", { returnRequest, order });
  return returnRequest;
};

// Workflow: requested -> admin_review -> approved -> pickup_scheduled -> picked_up
//        -> inspecting -> refunded -> completed  (or -> rejected at admin_review/inspecting)
export const updateReturnStatus = async ({ returnId, status, note, refundAmount }) => {
  const returnRequest = await ReturnRequest.findById(returnId).populate("order");
  if (!returnRequest) throw new ApiError(404, "Return request not found.");

  returnRequest.status = status;
  returnRequest.statusHistory.push({ status, note });
  if (refundAmount != null) returnRequest.refundAmount = refundAmount;
  await returnRequest.save();

  if (status === "picked_up" || status === "inspecting") {
    // Restock inventory on inspection start — adjust to "picked_up" if your warehouse
    // prefers to restock before inspection instead of after.
    for (const item of returnRequest.items) {
      const inv = await Inventory.findOneAndUpdate(
        { product: item.product },
        { $inc: { currentStock: item.quantity, returnedStock: item.quantity } },
        { new: true, upsert: true }
      );
      await InventoryTransaction.create({
        product: item.product,
        type: "return",
        quantityChange: item.quantity,
        newQuantity: inv.currentStock,
        reason: item.reason,
        reference: returnRequest.order.orderNumber,
      });
    }
  }

  if (status === "refunded") {
    const payment = await Payment.findOne({ order: returnRequest.order._id });
    if (payment) {
      payment.status = "refunded";
      await payment.save();
    }
    returnRequest.order.paymentStatus = "refunded";
    returnRequest.order.status = "refunded";
    returnRequest.order.statusHistory.push({ status: "refunded", note: "Refund processed" });
    await returnRequest.order.save();
  }

  emitEvent("return:statusChanged", { returnRequest, status });
  return returnRequest;
};

export const getReturnsForCustomer = (customerId) =>
  ReturnRequest.find({ customer: customerId }).populate("order", "orderNumber total").sort({ createdAt: -1 });

export const getAllReturns = ({ status } = {}) =>
  ReturnRequest.find(status ? { status } : {})
    .populate("customer", "name email")
    .populate("order", "orderNumber total")
    .sort({ createdAt: -1 });
