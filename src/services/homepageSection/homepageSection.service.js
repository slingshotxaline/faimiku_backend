import HomepageSection from "../../models/HomepageSection.js";
import Product from "../../models/Product.js";
import { ApiError } from "../../utils/ApiError.js";

const PRODUCT_CARD_FIELDS =
  "title slug basePrice offerPrice specialPrice oldPrice baseImage images ratingsAverage isHotSale isNewArrival isFlashSale stock hasVariants";

const resolveProducts = async (section) => {
  if (section.sourceType === "category") {
    if (!section.category) return [];
    return Product.find({ category: section.category, isActive: true })
      .sort({ createdAt: -1 })
      .limit(section.limit)
      .select(PRODUCT_CARD_FIELDS);
  }

  if (section.sourceType === "promo") {
    if (!section.promoFlag) return [];
    return Product.find({ [section.promoFlag]: true, isActive: true })
      .sort({ createdAt: -1 })
      .limit(section.limit)
      .select(PRODUCT_CARD_FIELDS);
  }

  if (section.sourceType === "custom") {
    if (!section.products?.length) return [];
    const products = await Product.find({
      _id: { $in: section.products },
      isActive: true,
    }).select(PRODUCT_CARD_FIELDS);
    const byId = new Map(products.map((p) => [String(p._id), p]));
    return section.products.map((id) => byId.get(String(id))).filter(Boolean);
  }

  return [];
};

export const getActiveSectionsWithProducts = async () => {
  const sections = await HomepageSection.find({ isActive: true })
    .populate("category", "name slug")
    .sort({ sortOrder: 1 });

  const resolved = await Promise.all(
    sections.map(async (section) => ({
      _id: section._id,
      title: section.title,
      subtitle: section.subtitle,
      sourceType: section.sourceType,
      layout: section.layout,
      banner: section.banner,
      category: section.category,
      products: await resolveProducts(section),
    }))
  );

  return resolved.filter((s) => s.products.length > 0);
};

export const getAllSections = () =>
  HomepageSection.find()
    .populate("category", "name slug")
    .populate("products", "title slug baseImage")
    .sort({ sortOrder: 1 });

export const createSection = async (data) => {
  validateSourceFields(data);
  return HomepageSection.create(data);
};

export const updateSection = async (id, data) => {
  if (data.sourceType || data.layout) validateSourceFields(data);
  const section = await HomepageSection.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!section) throw new ApiError(404, "Homepage section not found.");
  return section;
};

export const deleteSection = async (id) => {
  const section = await HomepageSection.findByIdAndDelete(id);
  if (!section) throw new ApiError(404, "Homepage section not found.");
};

const validateSourceFields = (data) => {
  if (data.sourceType === "category" && !data.category) {
    throw new ApiError(400, "Select a category for a category-based section.");
  }
  if (data.sourceType === "promo" && !data.promoFlag) {
    throw new ApiError(
      400,
      "Select a promo flag (Featured, New Arrival, Hot Sale, or Flash Sale)."
    );
  }
  if (
    data.sourceType === "custom" &&
    (!data.products || data.products.length === 0)
  ) {
    throw new ApiError(400, "Add at least one product for a custom section.");
  }
  if (data.layout === "featured" && !data.banner?.image?.url) {
    throw new ApiError(
      400,
      "Upload a banner image for a Featured Collection section."
    );
  }
};
