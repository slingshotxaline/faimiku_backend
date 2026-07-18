import { asyncHandler } from "../utils/asyncHandler.js";
import { sendCsv } from "../utils/csv.js";
import * as userService from "../services/user/user.service.js";
import { logActivity } from "../services/activity/activity.service.js";

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, {
    name: req.body.name,
    phone: req.body.phone,
  });
  logActivity({
    userId: req.user._id,
    action: "user.updateProfile",
    entityType: "User",
    entityId: req.user._id,
    req,
  });
  res.status(200).json({ success: true, data: { user } });
});

export const addAddress = asyncHandler(async (req, res) => {
  const addresses = await userService.addAddress(req.user._id, req.body);
  res.status(201).json({ success: true, data: addresses });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const addresses = await userService.updateAddress(
    req.user._id,
    req.params.addressId,
    req.body
  );
  res.status(200).json({ success: true, data: addresses });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const addresses = await userService.deleteAddress(
    req.user._id,
    req.params.addressId
  );
  res.status(200).json({ success: true, data: addresses });
});

export const getCustomers = asyncHandler(async (req, res) => {
  const { customers, pagination } = await userService.getCustomers(req.query);
  res.status(200).json({ success: true, data: customers, pagination });
});

export const exportCustomers = asyncHandler(async (req, res) => {
  const csv = await userService.getCustomersAsCsv();
  sendCsv(res, `customers-${new Date().toISOString().slice(0, 10)}.csv`, csv);
});
