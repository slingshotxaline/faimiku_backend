// backend/src/controllers/analytics.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import * as analyticsService from "../services/analytics/analytics.service.js";
import * as trafficService from "../services/analytics/traffic.service.js";
import { resolveDateRangeFromQuery } from "../utils/dateRange.js";

export const getSummary = asyncHandler(async (req, res) => {
  const dateRange = resolveDateRangeFromQuery(req.query);
  const summary = await analyticsService.getDashboardSummary(dateRange);
  res.status(200).json({ success: true, data: summary });
});

export const getSalesAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getSalesAnalytics(req.query);
  res.status(200).json({ success: true, data });
});

export const getCustomerAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getCustomerAnalytics(req.query);
  res.status(200).json({ success: true, data });
});

export const getProductAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getProductAnalytics();
  res.status(200).json({ success: true, data });
});

export const getTrafficSummary = asyncHandler(async (req, res) => {
  const data = await trafficService.getTrafficSummary();
  res.status(200).json({ success: true, data });
});

export const getDailyTraffic = asyncHandler(async (req, res) => {
  const data = await trafficService.getDailyTraffic(
    Number(req.query.days) || 14
  );
  res.status(200).json({ success: true, data });
});

export const getTopPages = asyncHandler(async (req, res) => {
  const data = await trafficService.getTopPages(Number(req.query.days) || 30);
  res.status(200).json({ success: true, data });
});

export const getTopClicks = asyncHandler(async (req, res) => {
  const data = await trafficService.getTopClicks(Number(req.query.days) || 30);
  res.status(200).json({ success: true, data });
});

export const getDeviceBreakdown = asyncHandler(async (req, res) => {
  const data = await trafficService.getDeviceBreakdown(
    Number(req.query.days) || 30
  );
  res.status(200).json({ success: true, data });
});

export const getEventLog = asyncHandler(async (req, res) => {
  const { events, pagination } = await trafficService.getEventLog(req.query);
  res.status(200).json({ success: true, data: events, pagination });
});



