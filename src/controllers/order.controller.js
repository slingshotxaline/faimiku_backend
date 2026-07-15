import { asyncHandler } from "../utils/asyncHandler.js";
import * as orderService from "../services/order/order.service.js";
import { REFRESH_COOKIE_OPTS } from "../utils/cookies.js";

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
  const { order, user, accessToken, refreshToken } = await orderService.createGuestOrder({
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
  const order = await orderService.getOrderById(req.params.id);
  res.status(200).json({ success: true, data: order });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.id, req.body.status, req.body.note);
  res.status(200).json({ success: true, data: order });
});
