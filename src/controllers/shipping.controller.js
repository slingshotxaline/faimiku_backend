import { asyncHandler } from "../utils/asyncHandler.js";
import * as shippingService from "../services/shipping/shipping.service.js";

export const getActiveZones = asyncHandler(async (req, res) => {
  const zones = await shippingService.getActiveZones();
  res.status(200).json({ success: true, data: zones });
});

export const getAllZones = asyncHandler(async (req, res) => {
  const zones = await shippingService.getAllZones();
  res.status(200).json({ success: true, data: zones });
});

export const createZone = asyncHandler(async (req, res) => {
  const zone = await shippingService.createZone(req.body);
  res.status(201).json({ success: true, data: zone });
});

export const updateZone = asyncHandler(async (req, res) => {
  const zone = await shippingService.updateZone(req.params.id, req.body);
  res.status(200).json({ success: true, data: zone });
});

export const deleteZone = asyncHandler(async (req, res) => {
  await shippingService.deleteZone(req.params.id);
  res
    .status(200)
    .json({ success: true, message: "Shipping zone deactivated." });
});
