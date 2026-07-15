import mongoose from "mongoose";

// Admin-configurable delivery zones with their own charge — e.g. "Inside
// Dhaka" at ৳70 today, "Outside Dhaka" at ৳120 today. Charges are meant to
// change often (fuel prices, courier contracts), so they live here instead
// of being hardcoded — update from /admin/shipping and it takes effect on
// the next order immediately.
const shippingZoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // "Inside Dhaka"
    key: { type: String, required: true, unique: true, lowercase: true, trim: true }, // "inside_dhaka" — stable identifier, safe to reference from Order
    charge: { type: Number, required: true, min: 0 },
    description: String, // e.g. "Dhaka city and immediate suburbs"
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false }, // pre-selected at checkout when true
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("ShippingZone", shippingZoneSchema);