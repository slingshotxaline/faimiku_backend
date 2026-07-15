import ActivityLog from "../../models/ActivityLog.js";
import logger from "../../utils/logger.js";

// Fire-and-forget — a logging failure should never break the request that
// triggered it, so this never throws.
export const logActivity = async ({ userId, action, entityType, entityId, req, metadata }) => {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      entityType,
      entityId,
      ipAddress: req?.ip,
      userAgent: req?.headers?.["user-agent"],
      metadata,
    });
  } catch (err) {
    logger.error(`Activity log failed: ${err.message}`);
  }
};

export const getActivityLogs = async ({ page = 1, limit = 50, action, userId }) => {
  const filter = {};
  if (action) filter.action = action;
  if (userId) filter.user = userId;

  const skip = (Number(page) - 1) * Number(limit);
  const [logs, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    ActivityLog.countDocuments(filter),
  ]);

  return { logs, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) } };
};
