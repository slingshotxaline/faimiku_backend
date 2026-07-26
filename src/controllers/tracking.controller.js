// backend/src/controllers/tracking.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import * as trackingService from "../services/tracking/tracking.service.js";
import jwt from "jsonwebtoken";

const tryGetUserId = (req) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET).id;
  } catch {
    return null;
  }
};

export const track = asyncHandler(async (req, res) => {
  await trackingService.logEvent({
    visitorId: req.body.visitorId,
    userId: tryGetUserId(req),
    type: req.body.type,
    path: req.body.path,
    label: req.body.label,
    referrer: req.body.referrer,
    userAgent: req.headers["user-agent"],
  });
  res.status(204).end();
});
