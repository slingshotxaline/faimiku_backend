import Inventory from "../../models/Inventory.js";

export const ensureInventoryRecord = async (product, variantId, warehouse = "Dhaka") => {
  const existing = await Inventory.findOne({ product: product._id, variantId: variantId || null, warehouse });
  if (existing) return existing;

  const baseline = variantId
    ? product.variants.id(variantId)?.stock ?? 0
    : product.stock ?? 0;

  return Inventory.create({
    product: product._id,
    variantId: variantId || null,
    warehouse,
    currentStock: baseline,
  });
};