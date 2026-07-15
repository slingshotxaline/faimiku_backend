import { Router } from "express";
import * as orderController from "../controllers/order.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import { withActivityLog } from "../middleware/activityLogger.js";

const router = Router();

router.post("/", protect, orderController.createOrder);
router.post("/guest", orderController.createGuestOrder); // no protect — guest checkout
router.get("/my", protect, orderController.getMyOrders);
router.get("/", protect, authorize("admin", "super_admin", "warehouse", "finance", "support"), orderController.getAllOrders);
router.get("/:id", protect, orderController.getOrder);
router.patch(
  "/:id/status",
  protect,
  authorize("admin", "super_admin", "warehouse"),
  withActivityLog("order.statusUpdate", (req) => ({
    entityType: "Order",
    entityId: req.params.id,
    metadata: { newStatus: req.body.status },
  })),
  orderController.updateOrderStatus
);



export default router;
