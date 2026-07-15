import { Router } from "express";
import * as returnsController from "../controllers/returns.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();
const staffOnly = authorize("admin", "super_admin", "support", "finance");

router.post("/", protect, returnsController.createReturnRequest);
router.get("/my", protect, returnsController.getMyReturns);
router.get("/", protect, staffOnly, returnsController.getAllReturns);
router.patch("/:id/status", protect, staffOnly, returnsController.updateReturnStatus);

export default router;
