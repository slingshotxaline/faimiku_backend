import axios from "axios";
import { ApiError } from "../../utils/ApiError.js";

// bKash Tokenized Checkout (PGW) API — sandbox docs:
// https://developer.bka.sh/docs/tokenized-checkout-url-1
// Flow: grant token -> create payment -> redirect customer to bkashURL ->
// bKash redirects back to our callback -> execute payment -> verify status.
const BKASH_BASE_URL = process.env.BKASH_IS_LIVE === "true"
  ? "https://tokenized.pay.bka.sh/v1.2.0-beta"
  : "https://tokenized.sandbox.bka.sh/v1.2.0-beta";

let cachedToken = null;
let tokenExpiresAt = 0;

const getToken = async () => {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  try {
    const { data } = await axios.post(
      `${BKASH_BASE_URL}/tokenized/checkout/token/grant`,
      {
        app_key: process.env.BKASH_APP_KEY,
        app_secret: process.env.BKASH_APP_SECRET,
      },
      {
        headers: {
          username: process.env.BKASH_USERNAME,
          password: process.env.BKASH_PASSWORD,
          "Content-Type": "application/json",
        },
      }
    );

    if (!data.id_token) throw new ApiError(502, "Could not authenticate with bKash.");

    cachedToken = data.id_token;
    tokenExpiresAt = Date.now() + (Number(data.expires_in || 3300) - 60) * 1000;
    return cachedToken;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(502, "bKash authentication failed. Check BKASH_* credentials.");
  }
};

const authHeaders = async () => {
  const token = await getToken();
  return {
    Authorization: token,
    "X-App-Key": process.env.BKASH_APP_KEY,
    "Content-Type": "application/json",
  };
};

export const createBkashPayment = async ({ order }) => {
  const headers = await authHeaders();
  try {
    const { data } = await axios.post(
      `${BKASH_BASE_URL}/tokenized/checkout/create`,
      {
        mode: "0011",
        payerReference: order.orderNumber,
        callbackURL: `${process.env.SERVER_URL}/api/v1/payments/bkash/callback`,
        amount: String(order.total),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: order.orderNumber,
      },
      { headers }
    );

    if (!data.bkashURL || !data.paymentID) {
      throw new ApiError(502, data.statusMessage || "Could not create bKash payment session.");
    }

    return { gatewayUrl: data.bkashURL, paymentID: data.paymentID };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(502, "bKash payment session could not be created.");
  }
};

export const executeBkashPayment = async (paymentID) => {
  const headers = await authHeaders();
  const { data } = await axios.post(
    `${BKASH_BASE_URL}/tokenized/checkout/execute`,
    { paymentID },
    { headers }
  );
  return data;
};

export const queryBkashPayment = async (paymentID) => {
  const headers = await authHeaders();
  const { data } = await axios.post(
    `${BKASH_BASE_URL}/tokenized/checkout/payment/status`,
    { paymentID },
    { headers }
  );
  return data;
};