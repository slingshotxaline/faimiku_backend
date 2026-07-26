import mongoose from "mongoose";

// Lightweight built-in traffic tracking — page views and click events,
// logged from the frontend via a fire-and-forget beacon (see
// frontend/lib/tracking.js). Not a replacement for a full analytics
// platform, but enough for "how many people visited, which pages, and
// which sections/banners/products they actually clicked" inside the
// admin dashboard, with no third-party dependency.
const analyticsEventSchema = new mongoose.Schema(
  {
    // Anonymous, persisted client-side (localStorage) so repeat visits
    // from the same browser count as one "visitor" across sessions —
    // not perfectly accurate (cleared storage, multiple devices) but the
    // standard lightweight approach without invasive fingerprinting.
    visitorId: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    type: { type: String, enum: ["page_view", "click"], required: true },
    path: { type: String, required: true }, // e.g. "/", "/products/some-slug"
    // Free-form identifier for WHAT was clicked, only set for type "click":
    // "hero_banner:<bannerId>", "homepage_section:Hot Sale",
    // "product_card:<slug>", "category_tile:<categoryId>", etc.
    label: String,

    referrer: String,
    device: { type: String, enum: ["mobile", "tablet", "desktop"], default: "desktop" },
  },
  { timestamps: true }
);

analyticsEventSchema.index({ createdAt: -1 });
analyticsEventSchema.index({ type: 1, createdAt: -1 });
analyticsEventSchema.index({ path: 1, createdAt: -1 });
analyticsEventSchema.index({ visitorId: 1 });

export default mongoose.model("AnalyticsEvent", analyticsEventSchema);