import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import Order from "../models/Order.js";
import { streamInvoicePdf } from "../services/invoice/invoice.service.js";

export const downloadInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw new ApiError(404, "Order not found.");

  const isOwner = String(order.customer) === String(req.user._id);
  const isStaff = ["admin", "super_admin", "finance"].includes(req.user.role);
  if (!isOwner && !isStaff) throw new ApiError(403, "You cannot access this invoice.");

  streamInvoicePdf(order, res);
});
