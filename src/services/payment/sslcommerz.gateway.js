import axios from "axios";
import { ApiError } from "../../utils/ApiError.js";

// Thin wrapper around SSLCommerz's session API. Swap SSL_BASE_URL to the live
// endpoint when moving off the sandbox (see .env — SSLCOMMERZ_IS_LIVE).
const SSL_BASE_URL = process.env.SSLCOMMERZ_IS_LIVE === "true"
  ? "https://securepay.sslcommerz.com"
  : "https://sandbox.sslcommerz.com";

export const initSslcommerzSession = async ({ order, customer }) => {
  const payload = {
    store_id: process.env.SSLCOMMERZ_STORE_ID,
    store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD,
    total_amount: order.total,
    currency: "BDT",
    tran_id: order.orderNumber,
    success_url: `${process.env.SERVER_URL}/api/v1/payments/sslcommerz/callback?status=success`,
    fail_url: `${process.env.SERVER_URL}/api/v1/payments/sslcommerz/callback?status=fail`,
    cancel_url: `${process.env.SERVER_URL}/api/v1/payments/sslcommerz/callback?status=cancel`,
    ipn_url: `${process.env.SERVER_URL}/api/v1/payments/sslcommerz/ipn`,
    cus_name: customer.name,
    cus_email: customer.email,
    cus_add1: order.shippingAddress?.street || "N/A",
    cus_city: order.shippingAddress?.city || "N/A",
    cus_phone: order.shippingAddress?.phone || "N/A",
    shipping_method: "Courier",
    product_name: order.items.map((i) => i.title).join(", ").slice(0, 250),
    product_category: "General",
    product_profile: "general",
  };

  try {
    const { data } = await axios.post(
      `${SSL_BASE_URL}/gwprocess/v4/api.php`,
      new URLSearchParams(payload)
    );
    if (data.status !== "SUCCESS") {
      throw new ApiError(502, data.failedreason || "Failed to initiate payment session.");
    }
    return { gatewayUrl: data.GatewayPageURL, sessionKey: data.sessionkey };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(502, "Payment gateway is unreachable. Please try again.");
  }
};

export const validateSslcommerzTransaction = async (val_id) => {
  const { data } = await axios.get(
    `${SSL_BASE_URL}/validator/api/validationserverAPI.php`,
    {
      params: {
        val_id,
        store_id: process.env.SSLCOMMERZ_STORE_ID,
        store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD,
        format: "json",
      },
    }
  );
  return data; // caller checks data.status === "VALID" or "VALIDATED"
};
