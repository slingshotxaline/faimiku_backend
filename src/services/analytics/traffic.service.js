// backend/src/services/analytics/traffic.service.js
import AnalyticsEvent from "../../models/AnalyticsEvent.js";

const dateRangeFilter = (days) => ({
  createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
});

export const getTrafficSummary = async () => {
  const [today, last7Days, last30Days] = await Promise.all([
    summarizeWindow(1),
    summarizeWindow(7),
    summarizeWindow(30),
  ]);
  return { today, last7Days, last30Days };
};

const summarizeWindow = async (days) => {
  const filter = { type: "page_view", ...dateRangeFilter(days) };
  const [views, uniqueVisitors] = await Promise.all([
    AnalyticsEvent.countDocuments(filter),
    AnalyticsEvent.distinct("visitorId", filter).then((ids) => ids.length),
  ]);
  return { views, uniqueVisitors };
};

export const getDailyTraffic = async (days = 14) => {
  const results = await AnalyticsEvent.aggregate([
    { $match: { type: "page_view", ...dateRangeFilter(days) } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        views: { $sum: 1 },
        visitors: { $addToSet: "$visitorId" },
      },
    },
    {
      $project: {
        date: "$_id",
        views: 1,
        visitors: { $size: "$visitors" },
        _id: 0,
      },
    },
    { $sort: { date: 1 } },
  ]);
  return results;
};

export const getTopPages = async (days = 30, limit = 10) => {
  return AnalyticsEvent.aggregate([
    { $match: { type: "page_view", ...dateRangeFilter(days) } },
    { $group: { _id: "$path", views: { $sum: 1 } } },
    { $sort: { views: -1 } },
    { $limit: limit },
    { $project: { path: "$_id", views: 1, _id: 0 } },
  ]);
};

export const getTopClicks = async (days = 30, limit = 15) => {
  return AnalyticsEvent.aggregate([
    {
      $match: { type: "click", ...dateRangeFilter(days), label: { $ne: null } },
    },
    { $group: { _id: "$label", clicks: { $sum: 1 } } },
    { $sort: { clicks: -1 } },
    { $limit: limit },
    { $project: { label: "$_id", clicks: 1, _id: 0 } },
  ]);
};

export const getDeviceBreakdown = async (days = 30) => {
  return AnalyticsEvent.aggregate([
    { $match: { type: "page_view", ...dateRangeFilter(days) } },
    { $group: { _id: "$device", views: { $sum: 1 } } },
    { $project: { device: "$_id", views: 1, _id: 0 } },
  ]);
};

export const getEventLog = async ({ page = 1, limit = 50, type }) => {
  const filter = type ? { type } : {};
  const skip = (Number(page) - 1) * Number(limit);

  const [events, total] = await Promise.all([
    AnalyticsEvent.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    AnalyticsEvent.countDocuments(filter),
  ]);

  return {
    events,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};
