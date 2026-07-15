import ShippingZone from "../../models/ShippingZone.js";
import { ApiError } from "../../utils/ApiError.js";

export const getActiveZones = () =>
  ShippingZone.find({ isActive: true }).sort({ sortOrder: 1, charge: 1 });

export const getAllZones = () =>
  ShippingZone.find().sort({ sortOrder: 1, charge: 1 });

export const createZone = async (data) => {
  const existing = await ShippingZone.findOne({ key: data.key });
  if (existing) throw new ApiError(409, `A shipping zone with key "${data.key}" already exists.`);
  return ShippingZone.create(data);
};

export const updateZone = async (id, data) => {
  const zone = await ShippingZone.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!zone) throw new ApiError(404, "Shipping zone not found.");
  return zone;
};

export const deleteZone = async (id) => {
  const zone = await ShippingZone.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!zone) throw new ApiError(404, "Shipping zone not found.");
  return zone;
};

// Resolves the CURRENT charge for a zone at order time — this is what makes
// pricing "dynamic": the order always uses whatever the admin has it set to
// right now, never a stale number carried from the cart page. Also means the
// browser can't submit a fake shippingCost; only a zone id is trusted.
export const resolveShippingCost = async (zoneId) => {
  if (!zoneId) return { shippingCost: 0, zone: null };

  const zone = await ShippingZone.findOne({ _id: zoneId, isActive: true });
  if (!zone) throw new ApiError(400, "Selected shipping zone is not available.");

  return { shippingCost: zone.charge, zone };
};