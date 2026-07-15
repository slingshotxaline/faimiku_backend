import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadImage } from "../services/upload/upload.service.js";

export const uploadSingleImage = asyncHandler(async (req, res) => {
  const { image, folder } = req.body;
  if (!image) throw new ApiError(400, "No image data provided.");

  const result = await uploadImage(image, folder);
  res.status(200).json({ success: true, data: result });
});
