import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/User.js";

export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    "wishlist",
    "title slug basePrice oldPrice offerPrice specialPrice baseImage images stock isHotSale isNewArrival isFlashSale"
  );
  res.status(200).json({ success: true, data: user.wishlist });
});

export const addToWishlist = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { wishlist: req.params.productId },
  });
  res.status(200).json({ success: true, message: "Added to wishlist." });
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { wishlist: req.params.productId },
  });
  res.status(200).json({ success: true, message: "Removed from wishlist." });
});
