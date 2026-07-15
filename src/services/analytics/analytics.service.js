import Order from "../../models/Order.js";
import User from "../../models/User.js";
import Product from "../../models/Product.js";

const dateRangeFilter = (from, to) => {
  const filter = {};
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  return filter;
};

export const getDashboardSummary = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalRevenueAgg, ordersToday, pendingOrders, productCount, customerCount] = await Promise.all([
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    Order.countDocuments({ status: "pending" }),
    Product.countDocuments({ isActive: true }),
    User.countDocuments({ role: "customer" }),
  ]);

  return {
    totalRevenue: totalRevenueAgg[0]?.total || 0,
    ordersToday,
    pendingOrders,
    productCount,
    customerCount,
  };
};

export const getSalesAnalytics = async ({ from, to }) => {
  const match = { paymentStatus: "paid", ...dateRangeFilter(from, to) };

  const [byDay, totals] = await Promise.all([
    Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
          shipping: { $sum: "$shippingCost" },
          discount: { $sum: "$discount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$total" },
          shipping: { $sum: "$shippingCost" },
          discount: { $sum: "$discount" },
          orders: { $sum: 1 },
        },
      },
    ]),
  ]);

  return { byDay, totals: totals[0] || { revenue: 0, shipping: 0, discount: 0, orders: 0 } };
};

export const getCustomerAnalytics = async ({ from, to }) => {
  const match = dateRangeFilter(from, to);

  const [newCustomers, orderStats] = await Promise.all([
    User.countDocuments({ role: "customer", ...match }),
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: "$customer", orderCount: { $sum: 1 }, lifetimeValue: { $sum: "$total" } } },
    ]),
  ]);

  const returningCustomers = orderStats.filter((c) => c.orderCount > 1).length;
  const avgOrderValue = orderStats.length
    ? orderStats.reduce((sum, c) => sum + c.lifetimeValue, 0) / orderStats.reduce((sum, c) => sum + c.orderCount, 0)
    : 0;
  const avgLifetimeValue = orderStats.length
    ? orderStats.reduce((sum, c) => sum + c.lifetimeValue, 0) / orderStats.length
    : 0;

  return {
    newCustomers,
    returningCustomers,
    averageOrderValue: Math.round(avgOrderValue * 100) / 100,
    averageLifetimeValue: Math.round(avgLifetimeValue * 100) / 100,
  };
};

export const getProductAnalytics = async () => {
  const [bestSellers, mostViewed, highestRated, slowMoving] = await Promise.all([
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $unwind: "$items" },
      { $group: { _id: "$items.product", unitsSold: { $sum: "$items.quantity" } } },
      { $sort: { unitsSold: -1 } },
      { $limit: 10 },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
      { $unwind: "$product" },
      { $project: { title: "$product.title", slug: "$product.slug", unitsSold: 1 } },
    ]),
    // "Most viewed" needs a view-tracking field; placeholder using ratingsCount as a proxy
    // until a real view counter is added to Product.
    Product.find({ isActive: true }).sort({ ratingsCount: -1 }).limit(10).select("title slug ratingsCount"),
    Product.find({ isActive: true, ratingsCount: { $gt: 0 } })
      .sort({ ratingsAverage: -1 })
      .limit(10)
      .select("title slug ratingsAverage ratingsCount"),
    Product.find({ isActive: true }).sort({ createdAt: 1 }).limit(10).select("title slug createdAt"),
  ]);

  return { bestSellers, mostViewed, highestRated, slowMoving };
};
