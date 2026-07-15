import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true },
    attributes: { type: Map, of: String },
    price: { type: Number, required: true },
    compareAtPrice: Number,
    stock: { type: Number, default: 0 },
    images: [{ url: String, publicId: String }],
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: String,
    shortDescription: String,
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
    tags: [String],

    oldPrice: Number,
    basePrice: { type: Number, required: true },
    offerPrice: Number,
    specialPrice: Number,
    compareAtPrice: Number,

    baseImage: { url: String, publicId: String, alt: String },
    images: [{ url: String, publicId: String, alt: String }],
    videos: [{ url: String, publicId: String }],

    variants: [variantSchema],
    hasVariants: { type: Boolean, default: false },
    stock: { type: Number, default: 0 },
    attributes: { type: Map, of: String },
    relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    seo: { title: String, description: String, keywords: [String] },
    ratingsAverage: { type: Number, default: 0 },
    ratingsCount: { type: Number, default: 0 },

    isHotSale: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isFlashSale: { type: Boolean, default: false },

    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ title: "text", tags: "text", description: "text" });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ isHotSale: 1 });
productSchema.index({ isNewArrival: 1 });
productSchema.index({ isFlashSale: 1 });

productSchema.methods.getEffectivePrice = function () {
  return this.specialPrice ?? this.offerPrice ?? this.basePrice;
};

export default mongoose.model("Product", productSchema);
