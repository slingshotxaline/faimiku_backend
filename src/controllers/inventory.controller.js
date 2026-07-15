import { asyncHandler } from "../utils/asyncHandler.js";
import * as inventoryService from "../services/inventory/inventory.service.js";

export const getInventoryOverview = asyncHandler(async (req, res) => {
  const rows = await inventoryService.getInventoryOverview({
    search: req.query.search,
    lowStockOnly: req.query.lowStockOnly === "true",
    warehouse: req.query.warehouse,
  });
  res.status(200).json({ success: true, data: rows });
});

export const adjustStock = asyncHandler(async (req, res) => {
  const inventory = await inventoryService.adjustStock({
    productId: req.body.productId,
    variantId: req.body.variantId || null,
    type: req.body.type,
    quantityChange: Number(req.body.quantityChange),
    reason: req.body.reason,
    warehouse: req.body.warehouse,
    performedBy: req.user._id,
  });
  res.status(200).json({ success: true, data: inventory });
});

export const getProductHistory = asyncHandler(async (req, res) => {
  const { transactions, pagination } = await inventoryService.getProductInventoryHistory(
    req.params.productId,
    req.query
  );
  res.status(200).json({ success: true, data: transactions, pagination });
});