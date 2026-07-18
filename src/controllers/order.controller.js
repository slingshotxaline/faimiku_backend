import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { sendCsv } from "../utils/csv.js";
import * as orderService from "../services/order/order.service.js";
import { REFRESH_COOKIE_OPTS } from "../utils/cookies.js";

const STAFF_ROLES = ["admin", "super_admin", "warehouse", "finance", "support"];

export const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder({
    customerId: req.user._id,
    items: req.body.items,
    shippingAddress: req.body.shippingAddress,
    paymentMethod: req.body.paymentMethod,
    shippingZoneId: req.body.shippingZoneId,
    couponCode: req.body.couponCode,
  });
  res.status(201).json({ success: true, data: order });
});

export const createGuestOrder = asyncHandler(async (req, res) => {
  const { order, user, accessToken, refreshToken } =
    await orderService.createGuestOrder({
      name: req.body.name,
      phone: req.body.phone,
      items: req.body.items,
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      shippingZoneId: req.body.shippingZoneId,
      couponCode: req.body.couponCode,
    });

  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);
  res.status(201).json({ success: true, data: { order, user, accessToken } });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getOrdersForCustomer(req.user._id);
  res.status(200).json({ success: true, data: orders });
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const { orders, pagination } = await orderService.getAllOrders(req.query);
  res.status(200).json({ success: true, data: orders, pagination });
});

export const getOrder = asyncHandler(async (req, res) => {
  const { order, payments } = await orderService.getOrderById(req.params.id);

  const isOwner = String(order.customer._id) === String(req.user._id);
  const isStaff = STAFF_ROLES.includes(req.user.role);
  if (!isOwner && !isStaff)
    throw new ApiError(403, "You cannot view this order.");

  res
    .status(200)
    .json({
      success: true,
      data: { order, payments: isStaff ? payments : undefined },
    });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(
    req.params.id,
    req.body.status,
    req.body.note
  );
  res.status(200).json({ success: true, data: order });
});

export const exportOrders = asyncHandler(async (req, res) => {
  const csv = await orderService.getOrdersAsCsv(req.query);
  sendCsv(res, `orders-${new Date().toISOString().slice(0, 10)}.csv`, csv);
});
