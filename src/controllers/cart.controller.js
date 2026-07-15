import { asyncHandler } from "../utils/asyncHandler.js";
import Cart from "../models/Cart.js";

// Called by the frontend whenever the Redux cart changes (debounced) so the
// server has a copy to check for abandonment. This does NOT replace the
// client-side Redux cart — it's a mirror, not the source of truth for checkout.
export const syncCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOneAndUpdate(
    { customer: req.user._id },
    { items: req.body.items, lastActivityAt: new Date(), reminderSentAt: null },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.status(200).json({ success: true, data: cart });
});

export const clearServerCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate({ customer: req.user._id }, { items: [] });
  res.status(200).json({ success: true });
});
