import { Router } from "express";
import * as categoryController from "../controllers/category.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();
const productStaff = authorize("admin", "super_admin", "marketing");

router.get("/", categoryController.getCategories);
router.get("/all", protect, productStaff, categoryController.listAllCategories);
router.post("/", protect, productStaff, categoryController.createCategory);
router.patch("/:id", protect, productStaff, categoryController.updateCategory);
router.delete("/:id", protect, productStaff, categoryController.deleteCategory);

export default router;
