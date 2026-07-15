import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
    warehouse: { type: String, default: "Dhaka" },
    currentStock: { type: Number, default: 0 },
    reservedStock: { type: Number, default: 0 },
    soldStock: { type: Number, default: 0 },
    damagedStock: { type: Number, default: 0 },
    returnedStock: { type: Number, default: 0 },
    incomingStock: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
  },
  { timestamps: true }
);

inventorySchema.index({ product: 1, variantId: 1, warehouse: 1 }, { unique: true });

export default mongoose.model("Inventory", inventorySchema);
