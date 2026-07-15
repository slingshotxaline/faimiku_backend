import { Router } from "express";
import * as blogController from "../controllers/blog.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();
const cmsStaff = authorize("admin", "super_admin", "marketing");

router.get("/", blogController.getBlogPosts);
router.get("/all", protect, cmsStaff, blogController.listAllBlogPosts);
router.get("/:slug", blogController.getBlogPostBySlug);
router.post("/", protect, cmsStaff, blogController.createBlogPost);
router.patch("/:id", protect, cmsStaff, blogController.updateBlogPost);
router.delete("/:id", protect, cmsStaff, blogController.deleteBlogPost);

export default router;
