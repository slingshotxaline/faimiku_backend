import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home" },
    fullName: String,
    phone: String,
    street: String,
    city: String,
    district: String,
    postalCode: String,
    country: { type: String, default: "Bangladesh" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // email/password are optional now to support guest checkout accounts
    // (created from just name + phone at order time). `sparse: true` lets
    // multiple guest users exist with no email without violating uniqueness —
    // a sparse unique index simply skips documents missing the field.
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, minlength: 8, select: false },
    phone: { type: String, unique: true, sparse: true, trim: true },
    role: {
      type: String,
      enum: [
        "super_admin",
        "admin",
        "warehouse",
        "marketing",
        "finance",
        "support",
        "customer",
      ],
      default: "customer",
    },
    // true until the person sets a password — see auth.service.js setPasswordForGuest()
    isGuest: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    addresses: [addressSchema],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    refreshTokens: [
      { token: String, createdAt: { type: Date, default: Date.now } },
    ],
    otp: { code: String, expiresAt: Date, purpose: String },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  // Guest accounts have no password at all — never a match, not an error.
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.otp;
  return obj;
};

export default mongoose.model("User", userSchema);
