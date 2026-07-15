import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import Blog from "../models/Blog.js";

export const getBlogPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, tag, search } = req.query;
  const filter = { isPublished: true };
  if (category) filter.categories = category;
  if (tag) filter.tags = tag;
  if (search) filter.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);
  const [posts, total] = await Promise.all([
    Blog.find(filter)
      .populate("author", "name")
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select("-content"), // list view doesn't need the full body
    Blog.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: posts,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  });
});

export const getBlogPostBySlug = asyncHandler(async (req, res) => {
  const post = await Blog.findOneAndUpdate(
    { slug: req.params.slug, isPublished: true },
    { $inc: { views: 1 } },
    { new: true }
  ).populate("author", "name");

  if (!post) throw new ApiError(404, "Blog post not found.");
  res.status(200).json({ success: true, data: post });
});

export const listAllBlogPosts = asyncHandler(async (req, res) => {
  const posts = await Blog.find().populate("author", "name").sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: posts });
});

export const createBlogPost = asyncHandler(async (req, res) => {
  const post = await Blog.create({
    ...req.body,
    author: req.user._id,
    publishedAt: req.body.isPublished ? new Date() : null,
  });
  res.status(201).json({ success: true, data: post });
});

export const updateBlogPost = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.isPublished) {
    const existing = await Blog.findById(req.params.id);
    if (existing && !existing.publishedAt) updates.publishedAt = new Date();
  }
  const post = await Blog.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!post) throw new ApiError(404, "Blog post not found.");
  res.status(200).json({ success: true, data: post });
});

export const deleteBlogPost = asyncHandler(async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: "Blog post deleted." });
});
