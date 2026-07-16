import { asyncHandler } from "../utils/asyncHandler.js";
import * as homepageSectionService from "../services/homepageSection/homepageSection.service.js";

// Public — the storefront homepage calls this directly, no auth needed.
export const getActiveSections = asyncHandler(async (req, res) => {
  const sections = await homepageSectionService.getActiveSectionsWithProducts();
  res.status(200).json({ success: true, data: sections });
});

export const getAllSections = asyncHandler(async (req, res) => {
  const sections = await homepageSectionService.getAllSections();
  res.status(200).json({ success: true, data: sections });
});

export const createSection = asyncHandler(async (req, res) => {
  const section = await homepageSectionService.createSection(req.body);
  res.status(201).json({ success: true, data: section });
});

export const updateSection = asyncHandler(async (req, res) => {
  const section = await homepageSectionService.updateSection(
    req.params.id,
    req.body
  );
  res.status(200).json({ success: true, data: section });
});

export const deleteSection = asyncHandler(async (req, res) => {
  await homepageSectionService.deleteSection(req.params.id);
  res.status(200).json({ success: true, message: "Homepage section deleted." });
});
