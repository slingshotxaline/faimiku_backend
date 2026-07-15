import mongoose from "mongoose";

// Generic CMS page: Homepage, About, Contact, Privacy Policy, Terms — anything
// the marketing team needs to edit without a deploy. `sections` is an ordered
// array of typed blocks so the frontend can render different layouts per section.
const sectionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["hero", "richText", "imageText", "faq", "cta", "custom"],
      required: true,
    },
    title: String,
    subtitle: String,
    body: String, // rich text / HTML
    image: { url: String, publicId: String },
    ctaLabel: String,
    ctaUrl: String,
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const pageSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true }, // "homepage", "about", "privacy-policy"
    title: { type: String, required: true },
    sections: [sectionSchema],
    seo: { title: String, description: String },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Page", pageSchema);
