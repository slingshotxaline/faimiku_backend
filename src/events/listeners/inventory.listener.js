import { onEvent, emitEvent } from "../eventBus.js";
import Inventory from "../../models/Inventory.js";
import InventoryTransaction from "../../models/InventoryTransaction.js";
import Product from "../../models/Product.js";
import { ensureInventoryRecord } from "../../services/inventory/ensureInventoryRecord.js";
import logger from "../../utils/logger.js";

onEvent("order:created", async ({ order }) => {
  try {
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (!product) continue;

      // Make sure a correctly-initialized Inventory record exists BEFORE
      // decrementing — this is the fix. Previously the $inc below ran with
      // upsert:true, which created a fresh record starting at 0.
      await ensureInventoryRecord(product, item.variantId, "Dhaka");

      const inv = await Inventory.findOneAndUpdate(
        {
          product: item.product,
          variantId: item.variantId || null,
          warehouse: "Dhaka",
        },
        {
          $inc: {
            reservedStock: item.quantity,
            currentStock: -item.quantity,
            soldStock: item.quantity,
          },
        },
        { new: true }
      );

      // Keep Product.stock / variant.stock in sync with the real Inventory
      // count. Previously orders never touched these fields at all, so the
      // storefront's "in stock" check kept showing the original seeded
      // quantity forever, regardless of how much had actually sold.
      if (item.variantId) {
        const variant = product.variants.id(item.variantId);
        if (variant) {
          variant.stock = inv.currentStock;
          await product.save();
        }
      } else if (!product.hasVariants) {
        product.stock = inv.currentStock;
        await product.save();
      }

      await InventoryTransaction.create({
        product: item.product,
        variantId: item.variantId || null,
        type: "sale",
        quantityChange: -item.quantity,
        newQuantity: inv.currentStock,
        reason: "Customer order",
        reference: order.orderNumber,
      });

      if (inv.currentStock <= inv.lowStockThreshold) {
        emitEvent("inventory:lowStock", {
          product,
          currentStock: inv.currentStock,
        });
      }
    }
  } catch (err) {
    logger.error(`Inventory listener error: ${err.message}`);
  }
});
