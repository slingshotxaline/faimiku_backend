import Inventory from "../../models/Inventory.js";
import InventoryTransaction from "../../models/InventoryTransaction.js";
import Product from "../../models/Product.js";
import { ApiError } from "../../utils/ApiError.js";
import { emitEvent } from "../../events/eventBus.js";
import { ensureInventoryRecord } from "./ensureInventoryRecord.js";

// Returns one row per product (or per variant, for products that have them)
// with all stock buckets, joined with product title/image for display.
export const getInventoryOverview = async ({
  search,
  lowStockOnly,
  warehouse,
} = {}) => {
  const productFilter = { isActive: true };
  if (search) productFilter.title = { $regex: search, $options: "i" };

  const products = await Product.find(productFilter).select(
    "title slug images hasVariants stock variants"
  );

  const inventoryFilter = warehouse ? { warehouse } : {};
  const inventoryDocs = await Inventory.find({
    product: { $in: products.map((p) => p._id) },
    ...inventoryFilter,
  });

  const inventoryByKey = new Map(
    inventoryDocs.map((doc) => [
      `${doc.product}:${doc.variantId || "base"}`,
      doc,
    ])
  );

  const rows = [];
  for (const product of products) {
    if (product.hasVariants && product.variants?.length) {
      for (const variant of product.variants) {
        const inv = inventoryByKey.get(`${product._id}:${variant._id}`);
        rows.push(buildRow(product, variant, inv));
      }
    } else {
      const inv = inventoryByKey.get(`${product._id}:base`);
      rows.push(buildRow(product, null, inv));
    }
  }

  return lowStockOnly ? rows.filter((r) => r.isLowStock) : rows;
};

const buildRow = (product, variant, inv) => {
  const currentStock =
    inv?.currentStock ?? (variant ? variant.stock : product.stock) ?? 0;
  const threshold = inv?.lowStockThreshold ?? 10;
  return {
    product: {
      _id: product._id,
      title: product.title,
      slug: product.slug,
      image: product.images?.[0]?.url,
    },
    variantId: variant?._id || null,
    variantLabel: variant
      ? Object.values(variant.attributes || {}).join(" / ") || variant.sku
      : null,
    currentStock,
    reservedStock: inv?.reservedStock || 0,
    soldStock: inv?.soldStock || 0,
    damagedStock: inv?.damagedStock || 0,
    returnedStock: inv?.returnedStock || 0,
    incomingStock: inv?.incomingStock || 0,
    lowStockThreshold: threshold,
    isLowStock: currentStock <= threshold,
    warehouse: inv?.warehouse || "Dhaka",
  };
};

const ADJUSTMENT_TYPES = ["purchase", "damaged", "adjustment", "incoming"];

// Manual stock adjustment from the admin dashboard — e.g. "+200 Purchase",
// "-5 Damaged", "+100 Supplier Stock". Every adjustment is logged to
// InventoryTransaction so there's a permanent audit trail (matches the spec's
// "Inventory History" requirement).
export const adjustStock = async ({
  productId,
  variantId,
  type,
  quantityChange,
  reason,
  warehouse,
  performedBy,
}) => {
  if (!ADJUSTMENT_TYPES.includes(type)) {
    throw new ApiError(
      400,
      `Invalid adjustment type. Must be one of: ${ADJUSTMENT_TYPES.join(", ")}`
    );
  }
  if (!quantityChange || quantityChange === 0)
    throw new ApiError(400, "Quantity change cannot be zero.");

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found.");

  await ensureInventoryRecord(product, variantId, warehouse || "Dhaka");

  const stockField =
    type === "damaged"
      ? "damagedStock"
      : type === "incoming"
      ? "incomingStock"
      : null;
  const inc = { currentStock: quantityChange };
  if (stockField && quantityChange > 0) inc[stockField] = quantityChange;

  const inventory = await Inventory.findOneAndUpdate(
    {
      product: productId,
      variantId: variantId || null,
      warehouse: warehouse || "Dhaka",
    },
    { $inc: inc },
    { new: true }
  );

  await InventoryTransaction.create({
    product: productId,
    variantId: variantId || null,
    warehouse: warehouse || "Dhaka",
    type,
    quantityChange,
    newQuantity: inventory.currentStock,
    reason,
    performedBy,
  });

  // Keep the denormalized stock count on Product/variant in sync so product
  // listing pages (which read Product.stock directly, not Inventory) stay accurate.
  if (variantId) {
    const variant = product.variants.id(variantId);
    if (variant) {
      variant.stock = inventory.currentStock;
      await product.save();
    }
  } else if (!product.hasVariants) {
    product.stock = inventory.currentStock;
    await product.save();
  }

  if (inventory.currentStock <= inventory.lowStockThreshold) {
    emitEvent("inventory:lowStock", {
      product,
      currentStock: inventory.currentStock,
    });
  }

  return inventory;
};

export const getProductInventoryHistory = async (
  productId,
  { page = 1, limit = 30 } = {}
) => {
  const skip = (Number(page) - 1) * Number(limit);
  const [transactions, total] = await Promise.all([
    InventoryTransaction.find({ product: productId })
      .populate("performedBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    InventoryTransaction.countDocuments({ product: productId }),
  ]);
  return {
    transactions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};
