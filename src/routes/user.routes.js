import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();
const customerStaff = authorize(
  "admin",
  "super_admin",
  "support",
  "finance",
  "marketing"
);

router.patch("/profile", protect, userController.updateProfile);
router.post("/addresses", protect, userController.addAddress);
router.patch("/addresses/:addressId", protect, userController.updateAddress);
router.delete("/addresses/:addressId", protect, userController.deleteAddress);

router.get("/customers", protect, customerStaff, userController.getCustomers);
router.get(
  "/customers/export.csv",
  protect,
  customerStaff,
  userController.exportCustomers
);

export default router;
