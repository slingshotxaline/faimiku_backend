import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    excerpt: String,
    content: { type: String, required: true }, // rich text / HTML from the editor
    coverImage: { url: String, publicId: String },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    categories: [String],
    tags: [String],
    seo: { title: String, description: String, keywords: [String] },
    isPublished: { type: Boolean, default: false },
    publishedAt: Date,
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

blogSchema.index({ title: "text", excerpt: "text", content: "text" });

export default mongoose.model("Blog", blogSchema);
