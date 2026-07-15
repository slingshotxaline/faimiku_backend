import { asyncHandler } from "../utils/asyncHandler.js";
import * as activityService from "../services/activity/activity.service.js";

export const getActivityLogs = asyncHandler(async (req, res) => {
  const { logs, pagination } = await activityService.getActivityLogs(req.query);
  res.status(200).json({ success: true, data: logs, pagination });
});
