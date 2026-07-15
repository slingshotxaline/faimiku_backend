import cron from "node-cron";
import Cart from "../models/Cart.js";
import User from "../models/User.js";
import { sendAbandonedCartEmail } from "../services/email/email.service.js";
import logger from "../utils/logger.js";

const ABANDONED_AFTER_HOURS = 3;

// Runs every 30 minutes: finds carts with items, no activity in the last
// ABANDONED_AFTER_HOURS hours, and no reminder sent yet — sends one reminder
// each, then marks it so the same cart doesn't get emailed twice.
const runAbandonedCartSweep = async () => {
  const cutoff = new Date(Date.now() - ABANDONED_AFTER_HOURS * 60 * 60 * 1000);

  const abandonedCarts = await Cart.find({
    "items.0": { $exists: true },
    lastActivityAt: { $lte: cutoff },
    reminderSentAt: null,
  }).populate("customer", "name email");

  for (const cart of abandonedCarts) {
    if (!cart.customer) continue;
    await sendAbandonedCartEmail(cart.customer, cart);
    cart.reminderSentAt = new Date();
    await cart.save();
    logger.info(`Abandoned cart reminder sent to ${cart.customer.email}`);
  }

  if (abandonedCarts.length) logger.info(`Abandoned cart sweep: ${abandonedCarts.length} reminder(s) sent.`);
};

export const startAbandonedCartJob = () => {
  // Every 30 minutes. Adjust the cron expression for your traffic patterns.
  cron.schedule("*/30 * * * *", runAbandonedCartSweep);
};
