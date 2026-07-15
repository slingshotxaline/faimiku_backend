import Category from "../../models/Category.js";
import Brand from "../../models/Brand.js";

// Parses queries like "gaming laptop under 100000", "blue nike shoes", "cheap office chair"
// into structured filters, without an LLM call — cheap regex/keyword heuristics that
// cover the common patterns from the spec. Swap for an actual NLU service later by
// keeping the same return shape: { keywords, maxPrice, minPrice, brand, category }.
const PRICE_UNDER_RE = /(under|below|less than|within)\s*(?:tk|৳|bdt)?\s*([\d,]+)/i;
const PRICE_OVER_RE = /(over|above|more than)\s*(?:tk|৳|bdt)?\s*([\d,]+)/i;
const CHEAP_WORDS = ["cheap", "budget", "affordable", "inexpensive"];
const PREMIUM_WORDS = ["premium", "luxury", "high-end", "expensive"];

const KNOWN_COLORS = [
  "red", "blue", "green", "black", "white", "yellow", "purple", "pink",
  "orange", "brown", "grey", "gray", "gold", "silver",
];

export const parseSmartQuery = async (query) => {
  const lower = query.toLowerCase();
  const filters = { keywords: [] };

  const underMatch = lower.match(PRICE_UNDER_RE);
  if (underMatch) filters.maxPrice = Number(underMatch[2].replace(/,/g, ""));

  const overMatch = lower.match(PRICE_OVER_RE);
  if (overMatch) filters.minPrice = Number(overMatch[2].replace(/,/g, ""));

  if (CHEAP_WORDS.some((w) => lower.includes(w))) filters.sort = "priceAsc";
  if (PREMIUM_WORDS.some((w) => lower.includes(w))) filters.sort = "priceDesc";

  const color = KNOWN_COLORS.find((c) => lower.includes(c));
  if (color) filters.color = color;

  // Strip the parts we've already extracted so what's left is the "core" search term
  let remaining = lower
    .replace(PRICE_UNDER_RE, "")
    .replace(PRICE_OVER_RE, "")
    .replace(new RegExp(CHEAP_WORDS.join("|"), "gi"), "")
    .replace(new RegExp(PREMIUM_WORDS.join("|"), "gi"), "")
    .trim();

  // Match against known brands/categories so "nike shoes" -> brand=Nike, keyword="shoes"
  const [brands, categories] = await Promise.all([Brand.find({ isActive: true }), Category.find({ isActive: true })]);

  const matchedBrand = brands.find((b) => remaining.includes(b.name.toLowerCase()));
  if (matchedBrand) {
    filters.brand = matchedBrand._id;
    remaining = remaining.replace(matchedBrand.name.toLowerCase(), "").trim();
  }

  const matchedCategory = categories.find((c) => remaining.includes(c.name.toLowerCase()));
  if (matchedCategory) {
    filters.category = matchedCategory._id;
    remaining = remaining.replace(matchedCategory.name.toLowerCase(), "").trim();
  }

  filters.keywords = remaining.split(/\s+/).filter(Boolean);
  filters.textSearch = filters.keywords.join(" ") || query;

  return filters;
};
