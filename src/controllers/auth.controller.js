import { asyncHandler } from "../utils/asyncHandler.js";
import * as authService from "../services/auth/auth.service.js";
import { logActivity } from "../services/activity/activity.service.js";
import { REFRESH_COOKIE_OPTS } from "../utils/cookies.js";

export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.registerUser(
    req.body
  );
  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);
  logActivity({
    userId: user._id,
    action: "auth.register",
    entityType: "User",
    entityId: user._id,
    req,
  });
  res.status(201).json({ success: true, data: { user, accessToken } });
});

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.loginUser(
    req.body
  );
  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);
  logActivity({
    userId: user._id,
    action: "auth.login",
    entityType: "User",
    entityId: user._id,
    req,
  });
  res.status(200).json({ success: true, data: { user, accessToken } });
});

export const refresh = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken } = await authService.refreshAccessToken(
    req.cookies?.refreshToken
  );
  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);
  res.status(200).json({ success: true, data: { accessToken } });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.user?._id, req.cookies?.refreshToken);
  logActivity({
    userId: req.user?._id,
    action: "auth.logout",
    entityType: "User",
    entityId: req.user?._id,
    req,
  });
  res.clearCookie("refreshToken");
  res.status(200).json({ success: true, message: "Logged out." });
});

export const logoutAllDevices = asyncHandler(async (req, res) => {
  await authService.logoutAllDevices(req.user._id);
  logActivity({
    userId: req.user._id,
    action: "auth.logoutAll",
    entityType: "User",
    entityId: req.user._id,
    req,
  });
  res.clearCookie("refreshToken");
  res
    .status(200)
    .json({ success: true, message: "Logged out of all devices." });
});

// Lets a guest-checkout account ("just a name and phone number") claim
// itself by adding an email + password, so they can log in normally next
// time instead of relying on a fresh guest order to re-identify them.
export const setPassword = asyncHandler(async (req, res) => {
  const user = await authService.setPasswordForGuest(req.user._id, {
    email: req.body.email,
    password: req.body.password,
  });
  logActivity({
    userId: req.user._id,
    action: "auth.setPassword",
    entityType: "User",
    entityId: req.user._id,
    req,
  });
  res.status(200).json({ success: true, data: { user } });
});

export const getMe = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json({ success: true, data: { user: req.user.toSafeObject() } });
});
