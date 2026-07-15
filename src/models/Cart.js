import mongoose from "mongoose";

// A lightweight server-side mirror of the cart, synced from the frontend's Redux
// state on every change (see cart.routes.js). This is what makes abandoned-cart
// reminders possible — the client-only Redux cart has nothing for a cron job to read.
const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
    title: String,
    price: Number,
    image: String,
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [cartItemSchema],
    reminderSentAt: Date,
    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Cart", cartSchema);
