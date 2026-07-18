import Order from "../../models/Order.js";
import Product from "../../models/Product.js";
import Payment from "../../models/Payment.js";
import { ApiError } from "../../utils/ApiError.js";
import { emitEvent } from "../../events/eventBus.js";
import { validateCoupon, recordCouponUsage } from "../coupon/coupon.service.js";
import {
  findOrCreateGuestUser,
  issueSessionForUser,
} from "../auth/auth.service.js";
import { resolveShippingCost } from "../shipping/shipping.service.js";
import { toCsv } from "../../utils/csv.js";

const generateOrderNumber = () =>
  `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(
    Math.random() * 1000
  )}`;

export const createOrder = async ({
  customerId,
  items,
  shippingAddress,
  paymentMethod,
  shippingZoneId,
  couponCode,
}) => {
  if (!items?.length)
    throw new ApiError(400, "Order must contain at least one item.");

  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product || !product.isActive)
      throw new ApiError(404, `Product not found: ${item.productId}`);

    const price = product.hasVariants
      ? product.variants.id(item.variantId)?.price
      : product.getEffectivePrice();
    if (price == null) throw new ApiError(400, "Invalid product variant.");

    const lineTotal = price * item.quantity;
    subtotal += lineTotal;

    orderItems.push({
      product: product._id,
      variantId: item.variantId || null,
      category: product.category,
      title: product.title,
      image: product.images?.[0]?.url,
      price,
      quantity: item.quantity,
      subtotal: lineTotal,
    });
  }

  const { shippingCost, zone } = await resolveShippingCost(shippingZoneId);

  let discount = 0;
  let appliedCoupon = null;
  if (couponCode) {
    const result = await validateCoupon({
      code: couponCode,
      customerId,
      subtotal,
      items: orderItems,
    });
    discount = result.discount;
    appliedCoupon = result.coupon;
  }

  const total = subtotal + shippingCost - discount;

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    customer: customerId,
    items: orderItems,
    shippingAddress,
    subtotal,
    shippingZone: zone?._id || null,
    shippingZoneName: zone?.name || null,
    shippingCost,
    discount,
    coupon: appliedCoupon?._id || null,
    total,
    paymentMethod,
    statusHistory: [{ status: "pending", note: "Order placed" }],
  });

  if (appliedCoupon) await recordCouponUsage(appliedCoupon._id, customerId);

  emitEvent("order:created", { order });

  return order;
};

export const createGuestOrder = async ({
  name,
  phone,
  items,
  shippingAddress,
  paymentMethod,
  shippingZoneId,
  couponCode,
}) => {
  if (!name || !phone)
    throw new ApiError(400, "Name and phone number are required.");

  const user = await findOrCreateGuestUser({ name, phone });
  const order = await createOrder({
    customerId: user._id,
    items,
    shippingAddress,
    paymentMethod,
    shippingZoneId,
    couponCode,
  });

  const { accessToken, refreshToken } = await issueSessionForUser(user);

  return { order, user: user.toSafeObject(), accessToken, refreshToken };
};

export const updateOrderStatus = async (orderId, status, note) => {
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found.");

  order.status = status;
  order.statusHistory.push({ status, note });
  await order.save();

  emitEvent("order:statusChanged", { order, status });
  return order;
};

export const getOrdersForCustomer = (customerId) =>
  Order.find({ customer: customerId }).sort({ createdAt: -1 });

export const getAllOrders = async ({ page = 1, limit = 20, status }) => {
  const filter = status ? { status } : {};
  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("customer", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getOrderById = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate("customer", "name email phone isGuest")
    .populate("coupon", "code type value");
  if (!order) throw new ApiError(404, "Order not found.");

  const payments = await Payment.find({ order: order._id }).sort({
    createdAt: -1,
  });

  return { order, payments };
};

export const getOrdersAsCsv = async ({ status, from, to }) => {
  const filter = {};
  if (status) filter.status = status;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const orders = await Order.find(filter)
    .populate("customer", "name email phone")
    .sort({ createdAt: -1 });

  return toCsv(orders, [
    { label: "Order #", key: "orderNumber" },
    { label: "Date", get: (o) => new Date(o.createdAt).toISOString() },
    { label: "Customer Name", get: (o) => o.customer?.name || "" },
    { label: "Customer Email", get: (o) => o.customer?.email || "" },
    { label: "Customer Phone", get: (o) => o.customer?.phone || "" },
    { label: "Items", get: (o) => o.items.length },
    { label: "Subtotal", key: "subtotal" },
    { label: "Discount", key: "discount" },
    { label: "Shipping", key: "shippingCost" },
    { label: "Total", key: "total" },
    { label: "Payment Method", key: "paymentMethod" },
    { label: "Payment Status", key: "paymentStatus" },
    { label: "Order Status", key: "status" },
    {
      label: "Shipping Address",
      get: (o) =>
        [
          o.shippingAddress?.street,
          o.shippingAddress?.city,
          o.shippingAddress?.district,
        ]
          .filter(Boolean)
          .join(", "),
    },
  ]);
};
