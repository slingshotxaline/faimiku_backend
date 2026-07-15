import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import Page from "../models/Page.js";

export const getPageBySlug = asyncHandler(async (req, res) => {
  const page = await Page.findOne({ slug: req.params.slug, isPublished: true });
  if (!page) throw new ApiError(404, "Page not found.");
  res.status(200).json({ success: true, data: page });
});

export const listPages = asyncHandler(async (req, res) => {
  const pages = await Page.find().sort({ title: 1 });
  res.status(200).json({ success: true, data: pages });
});

export const upsertPage = asyncHandler(async (req, res) => {
  const page = await Page.findOneAndUpdate(
    { slug: req.body.slug },
    req.body,
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.status(200).json({ success: true, data: page });
});

export const deletePage = asyncHandler(async (req, res) => {
  await Page.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: "Page deleted." });
});
