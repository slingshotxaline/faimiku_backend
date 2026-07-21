import mongoose from "mongoose";

// Drives the customizable product rows on the storefront homepage — each
// section pulls its products from one of three sources, chosen by the admin
// at /admin/homepage-sections:
//   "category" — all active products in a chosen Category (e.g. "Men", "Wallet")
//   "promo"    — all products with a given promo flag (Featured/New Arrival/
//                Hot Sale/Flash Sale — see Product.js isHotSale etc.)
//   "custom"   — a hand-picked, manually ordered list of specific products
const homepageSectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true }, // "Men's Collection", "Hot Sale"
    subtitle: String,

    sourceType: { type: String, enum: ["category", "promo", "custom"], required: true },

    // Only one of these is used, depending on sourceType:
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    promoFlag: { type: String, enum: ["isFeatured", "isNewArrival", "isHotSale", "isFlashSale"] },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], // custom — order is preserved

    limit: { type: Number, default: 8 }, // how many to show for "category"/"promo" sources
    sortOrder: { type: Number, default: 0 }, // position on the homepage, top to bottom
    isActive: { type: Boolean, default: true },
    layout: { type: String, enum: ["grid", "featured"], default: "grid" },
    banner: {
      image: { url: String, publicId: String },
      title: String,
      subtitle: String,
      linkUrl: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("HomepageSection", homepageSectionSchema);