import { asyncHandler } from "../utils/asyncHandler.js";
import * as analyticsService from "../services/analytics/analytics.service.js";

export const getSummary = asyncHandler(async (req, res) => {
  const summary = await analyticsService.getDashboardSummary();
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
