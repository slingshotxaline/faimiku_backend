import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import orderRoutes from "./routes/order.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import returnsRoutes from "./routes/returns.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import searchRoutes from "./routes/search.routes.js";
import pageRoutes from "./routes/page.routes.js";
import bannerRoutes from "./routes/banner.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import recommendationRoutes from "./routes/recommendation.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import "./events/listeners/inventory.listener.js";
import "./events/listeners/notification.listener.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import shippingRoutes from "./routes/shipping.routes.js";
import brandRoutes from "./routes/brand.routes.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "15mb" })); // headroom for base64 image uploads
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  "/api/v1",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false })
);

app.get("/api/v1/health", (req, res) => res.json({ success: true, status: "ok" }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/coupons", couponRoutes);
app.use("/api/v1", reviewRoutes); // review.routes.js defines full sub-paths itself
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/invoices", invoiceRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/returns", returnsRoutes);
app.use("/api/v1/activity-logs", activityRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/pages", pageRoutes);
app.use("/api/v1/banners", bannerRoutes);
app.use("/api/v1/blog", blogRoutes);
app.use("/api/v1/recommendations", recommendationRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/shipping-zones", shippingRoutes);
app.use("/api/v1/brands", brandRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
