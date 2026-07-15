import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import { ApiError } from "../../utils/ApiError.js";
import logger from "../../utils/logger.js";

const MAX_ACTIVE_SESSIONS = 5;

const signAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  });

const signRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
  });

const pushRefreshToken = (user, token) => {
  user.refreshTokens.push({ token });
  if (user.refreshTokens.length > MAX_ACTIVE_SESSIONS) {
    user.refreshTokens = user.refreshTokens.slice(-MAX_ACTIVE_SESSIONS);
  }
};

export const registerUser = async ({ name, email, password, phone }) => {
  const existingByEmail = await User.findOne({ email });
  if (existingByEmail)
    throw new ApiError(409, "An account with this email already exists.");

  // If this phone number already belongs to a guest account (created
  // silently during a guest checkout), turn THAT account into a real one
  // instead of failing on the unique phone index or creating a duplicate
  // person. If it belongs to an already-registered account, that's a
  // genuine conflict — surface it clearly rather than as a raw DB error.
  let user = phone ? await User.findOne({ phone }) : null;
  if (user && !user.isGuest) {
    throw new ApiError(
      409,
      "An account with this phone number already exists."
    );
  }

  if (user) {
    user.name = name;
    user.email = email;
    user.password = password;
    user.isGuest = false;
  } else {
    user = new User({ name, email, password, phone });
  }

  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  pushRefreshToken(user, refreshToken);
  await user.save();

  return { user: user.toSafeObject(), accessToken, refreshToken };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password.");
  }
  if (!user.isActive)
    throw new ApiError(403, "This account has been deactivated.");

  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  pushRefreshToken(user, refreshToken);
  user.lastLoginAt = new Date();
  await user.save();

  return { user: user.toSafeObject(), accessToken, refreshToken };
};

export const refreshAccessToken = async (oldRefreshToken) => {
  if (!oldRefreshToken) throw new ApiError(401, "Refresh token missing.");

  let decoded;
  try {
    decoded = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token.");
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, "User no longer exists.");

  const tokenEntry = user.refreshTokens.find(
    (t) => t.token === oldRefreshToken
  );

  if (!tokenEntry) {
    user.refreshTokens = [];
    await user.save();
    logger.error(
      `Refresh token reuse detected for user ${user._id} — all sessions revoked.`
    );
    throw new ApiError(401, "Session invalid. Please log in again.");
  }

  const newRefreshToken = signRefreshToken(user._id);
  user.refreshTokens = user.refreshTokens.filter(
    (t) => t.token !== oldRefreshToken
  );
  pushRefreshToken(user, newRefreshToken);
  await user.save();

  const accessToken = signAccessToken(user._id);
  return { accessToken, refreshToken: newRefreshToken };
};

export const logoutUser = async (userId, refreshToken) => {
  await User.findByIdAndUpdate(userId, {
    $pull: { refreshTokens: { token: refreshToken } },
  });
};

export const logoutAllDevices = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshTokens: [] });
};

// Signs and stores a fresh token pair for an already-resolved user, without
// checking a password — used for guest checkout, where "logging in" just
// means the person placed an order under that name/phone.
export const issueSessionForUser = async (user) => {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  pushRefreshToken(user, refreshToken);
  user.lastLoginAt = new Date();
  await user.save();
  return { accessToken, refreshToken };
};

// Looks up a guest account by phone (the only identifier a guest checkout
// provides), or creates one. If a phone number already belongs to a real
// registered account (has a password), we still attach the order to that
// account — we just don't log the browser in as them, since that would let
// anyone "log in" as someone else just by typing their phone number.
export const findOrCreateGuestUser = async ({ name, phone }) => {
  if (!phone) throw new ApiError(400, "Phone number is required.");

  let user = await User.findOne({ phone });
  if (user) return user;

  try {
    user = await User.create({ name, phone, role: "customer", isGuest: true });
  } catch (err) {
    if (err.code === 11000) {
      user = await User.findOne({ phone });
      if (!user) throw err;
    } else {
      throw err;
    }
  }
  return user;
};

// "Claim" a guest account by giving it an email + password, so the person
// can log in normally next time instead of relying on guest-checkout lookup.
export const setPasswordForGuest = async (userId, { email, password }) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found.");

  if (email && email !== user.email) {
    const existing = await User.findOne({ email, _id: { $ne: user._id } });
    if (existing)
      throw new ApiError(
        409,
        "This email is already in use by another account."
      );
    user.email = email;
  }

  if (!user.email)
    throw new ApiError(400, "An email address is required to set a password.");

  user.password = password;
  user.isGuest = false;
  await user.save();
  return user.toSafeObject();
};
