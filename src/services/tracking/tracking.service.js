// backend/src/services/tracking/tracking.service.js
import AnalyticsEvent from "../../models/AnalyticsEvent.js";

const detectDevice = (userAgent = "") => {
  if (/tablet|ipad/i.test(userAgent)) return "tablet";
  if (/mobile|android|iphone/i.test(userAgent)) return "mobile";
  return "desktop";
};

// Intentionally minimal validation and no throwing — a tracking failure
// should never surface as an error to the visitor. The route wraps this
// in asyncHandler for safety, but this function itself stays forgiving.
export const logEvent = async ({
  visitorId,
  userId,
  type,
  path,
  label,
  referrer,
  userAgent,
}) => {
  if (!visitorId || !type || !path) return; // silently drop malformed beacons

  await AnalyticsEvent.create({
    visitorId,
    user: userId || null,
    type,
    path,
    label,
    referrer,
    device: detectDevice(userAgent),
  });
};
