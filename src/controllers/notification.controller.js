import { asyncHandler } from "../utils/asyncHandler.js";
import Notification from "../models/Notification.js";

export const getAdminNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ audience: "admin" })
    .sort({ createdAt: -1 })
    .limit(50);
  res.status(200).json({ success: true, data: notifications });
});

export const markAsRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.status(200).json({ success: true });
});
