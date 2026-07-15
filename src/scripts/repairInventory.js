import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "../models/Inventory.js";
import Product from "../models/Product.js";
import logger from "../utils/logger.js";

// One-time repair for Inventory records corrupted by the old upsert-from-0
// bug (see ensureInventoryRecord.js for the fix that prevents new corruption).
//
// Recovery logic: Product.stock / variant.stock were NEVER touched by the old
// buggy order listener — only the separate Inventory.currentStock was, and it
// started from 0 instead of the real quantity. That means Product.stock /
// variant.stock still hold the ORIGINAL correct baseline you set when you
// created the product. So the correct current stock is:
//
//   baseline (Product.stock / variant.stock) − soldStock + returnedStock − damagedStock
//
// This script recomputes that for every existing Inventory record, fixes
// Inventory.currentStock, and re-syncs Product.stock / variant.stock to match
// going forward. Run it ONCE after deploying the code fix:
//   node src/scripts/repairInventory.js
const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  logger.info("Connected for inventory repair...");

  const records = await Inventory.find();
  let fixed = 0;

  for (const inv of records) {
    const product = await Product.findById(inv.product);
    if (!product) {
      logger.info(`Skipping orphaned inventory record for missing product ${inv.product}`);
      continue;
    }

    const variant = inv.variantId ? product.variants.id(inv.variantId) : null;
    const baseline = variant ? variant.stock : product.stock;

    const correctedStock = baseline - inv.soldStock + inv.returnedStock - inv.damagedStock;

    if (correctedStock !== inv.currentStock) {
      logger.info(
        `${product.title}${variant ? ` (${Object.values(variant.attributes || {}).join("/")})` : ""}: ` +
        `${inv.currentStock} -> ${correctedStock}`
      );
      inv.currentStock = correctedStock;
      await inv.save();

      if (variant) {
        variant.stock = correctedStock;
      } else if (!product.hasVariants) {
        product.stock = correctedStock;
      }
      await product.save();
      fixed++;
    }
  }

  logger.info(`Repair complete. Fixed ${fixed} of ${records.length} inventory record(s).`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  logger.error(`Inventory repair failed: ${err.message}`);
  process.exit(1);
});