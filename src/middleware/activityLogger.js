import { logActivity } from "../services/activity/activity.service.js";

// Wraps a route handler to log an action after it succeeds, without cluttering
// the controller itself. Usage: router.patch("/:id", protect, withActivityLog(
//   "product.update", (req) => ({ entityType: "Product", entityId: req.params.id })
// ), controller)
export const withActivityLog = (action, describe = () => ({})) => (req, res, next) => {
  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const { entityType, entityId, metadata } = describe(req, res);
      logActivity({ userId: req.user?._id, action, entityType, entityId, req, metadata });
    }
  });
  next();
};
