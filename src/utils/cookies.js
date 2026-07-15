// Shared refresh-token cookie config so auth.controller.js and
// order.controller.js (guest checkout auto-login) stay in sync.
export const REFRESH_COOKIE_OPTS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };