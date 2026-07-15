import { Router } from "express";
import * as brandController from "../controllers/brand.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();
const productStaff = authorize("admin", "super_admin", "marketing");

router.get("/", brandController.getBrands);
router.get("/all", protect, productStaff, brandController.listAllBrands);
router.post("/", protect, productStaff, brandController.createBrand);
router.patch("/:id", protect, productStaff, brandController.updateBrand);
router.delete("/:id", protect, productStaff, brandController.deleteBrand);

export default router;