import { Resend } from "resend";
import logger from "../../utils/logger.js";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || "Enterprise Store <orders@yourdomain.com>";

// Central send function. Templates below build the subject/html; swap for React
// Email / MJML templates later without touching call sites.
const send = async ({ to, subject, html }) => {
  if (!resend) {
    logger.info(`[email:skipped, no RESEND_API_KEY] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    logger.error(`Email send failed to ${to}: ${err.message}`);
  }
};

export const sendWelcomeEmail = (user) =>
  send({
    to: user.email,
    subject: "Welcome to Enterprise Store",
    html: `<p>Hi ${user.name},</p><p>Thanks for creating an account. Happy shopping!</p>`,
  });

export const sendOrderConfirmationEmail = (order, customerEmail) =>
  send({
    to: customerEmail,
    subject: `Order Confirmed — ${order.orderNumber}`,
    html: `
      <p>Hi,</p>
      <p>We've received your order <strong>${order.orderNumber}</strong>.</p>
      <p>Total: <strong>৳${order.total.toLocaleString()}</strong></p>
      <p>We'll email you again once it ships.</p>
    `,
  });

export const sendShippingUpdateEmail = (order, customerEmail, status) =>
  send({
    to: customerEmail,
    subject: `Order ${order.orderNumber} — ${status}`,
    html: `<p>Your order <strong>${order.orderNumber}</strong> is now <strong>${status}</strong>.</p>`,
  });

export const sendPasswordResetOtpEmail = (email, otp) =>
  send({
    to: email,
    subject: "Your password reset code",
    html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
  });

export const sendAbandonedCartEmail = (customer, cart) =>
  send({
    to: customer.email,
    subject: "You left something in your cart",
    html: `
      <p>Hi ${customer.name},</p>
      <p>You still have ${cart.items.length} item(s) waiting in your cart.</p>
      <ul>
        ${cart.items.map((i) => `<li>${i.title} × ${i.quantity} — ৳${(i.price * i.quantity).toLocaleString()}</li>`).join("")}
      </ul>
      <p>Come back and check out before they're gone.</p>
    `,
  });
