import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: String,
    image: {
      url: { type: String, required: true },
      publicId: String,
    },
    linkUrl: String,
    placement: {
      type: String,
      enum: ["homepage_hero", "category_top", "sidebar"],
      default: "homepage_hero",
    },
    sortOrder: { type: Number, default: 0 },
    startsAt: Date,
    endsAt: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Banner", bannerSchema);
