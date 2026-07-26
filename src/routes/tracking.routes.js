// backend/src/routes/tracking.routes.js
import { Router } from "express";
import * as trackingController from "../controllers/tracking.controller.js";

const router = Router();

router.post("/", trackingController.track);

export default router;
