import mongoose from "mongoose";

const inventoryTransactionSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
    warehouse: { type: String, default: "Dhaka" },
    type: {
      type: String,
      enum: ["purchase", "sale", "return", "damaged", "adjustment", "incoming"],
      required: true,
    },
    quantityChange: { type: Number, required: true }, // + or -
    oldQuantity: Number,
    newQuantity: Number,
    reason: String,
    reference: String, // e.g. order ID
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("InventoryTransaction", inventoryTransactionSchema);
