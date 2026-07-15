import cloudinary from "../../config/cloudinary.js";
import { ApiError } from "../../utils/ApiError.js";

// Uploads a base64 data URL (what the frontend sends after FileReader.readAsDataURL)
// straight to Cloudinary with automatic compression/format conversion.
export const uploadImage = async (base64DataUrl, folder = "products") => {
  try {
    const result = await cloudinary.uploader.upload(base64DataUrl, {
      folder: `ecommerce/${folder}`,
      resource_type: "image",
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });
    return { url: result.secure_url, publicId: result.public_id };
  } catch (err) {
    throw new ApiError(502, "Image upload failed. Please try again.");
  }
};

export const deleteImage = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId).catch(() => {});
};
