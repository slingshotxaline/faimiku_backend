import User from "../../models/User.js";
import { ApiError } from "../../utils/ApiError.js";
import { toCsv } from "../../utils/csv.js";

export const updateProfile = async (userId, { name, phone }) => {
  if (phone) {
    const existing = await User.findOne({ phone, _id: { $ne: userId } });
    if (existing)
      throw new ApiError(
        409,
        "This phone number is already in use by another account."
      );
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { ...(name && { name }), ...(phone && { phone }) },
    { new: true, runValidators: true }
  );
  if (!user) throw new ApiError(404, "User not found.");
  return user.toSafeObject();
};

export const addAddress = async (userId, addressData) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found.");

  if (addressData.isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }
  if (user.addresses.length === 0) addressData.isDefault = true;

  user.addresses.push(addressData);
  await user.save();
  return user.toSafeObject().addresses;
};

export const updateAddress = async (userId, addressId, addressData) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found.");

  const address = user.addresses.id(addressId);
  if (!address) throw new ApiError(404, "Address not found.");

  if (addressData.isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }

  Object.assign(address, addressData);
  await user.save();
  return user.toSafeObject().addresses;
};

export const deleteAddress = async (userId, addressId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found.");

  const address = user.addresses.id(addressId);
  if (!address) throw new ApiError(404, "Address not found.");
  const wasDefault = address.isDefault;

  user.addresses.pull(addressId);
  if (wasDefault && user.addresses.length > 0)
    user.addresses[0].isDefault = true;

  await user.save();
  return user.toSafeObject().addresses;
};

export const getCustomers = async ({ page = 1, limit = 20, search }) => {
  const filter = { role: "customer" };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [customers, total] = await Promise.all([
    User.find(filter)
      .select("-password -refreshTokens -otp")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  return {
    customers,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getCustomersAsCsv = async () => {
  const customers = await User.find({ role: "customer" })
    .select("-password -refreshTokens -otp")
    .sort({ createdAt: -1 });

  return toCsv(customers, [
    { label: "Name", key: "name" },
    { label: "Email", key: "email" },
    { label: "Phone", key: "phone" },
    { label: "Guest Account", get: (u) => (u.isGuest ? "Yes" : "No") },
    { label: "Joined", get: (u) => new Date(u.createdAt).toISOString() },
    {
      label: "Last Login",
      get: (u) => (u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : ""),
    },
    { label: "Saved Addresses", get: (u) => u.addresses?.length || 0 },
    { label: "Active", get: (u) => (u.isActive ? "Yes" : "No") },
  ]);
};
