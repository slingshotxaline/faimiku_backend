import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  setPasswordSchema,
} from "../validators/auth.validator.js";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", protect, authController.logout);
router.post("/logout-all", protect, authController.logoutAllDevices);
router.patch(
  "/set-password",
  protect,
  validate(setPasswordSchema),
  authController.setPassword
);
router.get("/me", protect, authController.getMe);

export default router;
