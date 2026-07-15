import { Router } from "express";
import * as productController from "../controllers/product.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import { withActivityLog } from "../middleware/activityLogger.js";

const router = Router();

router.get("/", productController.getProducts);
router.get("/:slug", productController.getProductBySlug);

router.post(
  "/",
  protect,
  authorize("admin", "super_admin"),
  withActivityLog("product.create", (req) => ({ entityType: "Product" })),
  productController.createProduct
);
router.patch(
  "/:id",
  protect,
  authorize("admin", "super_admin"),
  withActivityLog("product.update", (req) => ({ entityType: "Product", entityId: req.params.id })),
  productController.updateProduct
);
router.delete(
  "/:id",
  protect,
  authorize("admin", "super_admin"),
  withActivityLog("product.delete", (req) => ({ entityType: "Product", entityId: req.params.id })),
  productController.deleteProduct
);

export default router;
