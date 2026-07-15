import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";
import Category from "../models/Category.js";
import Brand from "../models/Brand.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import logger from "../utils/logger.js";
import ShippingZone from "../models/ShippingZone.js";

// Idempotent-ish seed script: upserts by unique field so re-running doesn't
// duplicate data. Run with: npm run seed  (see package.json script added below)
//
// IMPORTANT: users are seeded via find + .save() rather than
// findOneAndUpdate(..., { upsert: true }) — Mongoose's findOneAndUpdate does
// NOT run pre("save") middleware, which is where User.js hashes the password.
// Using findOneAndUpdate here would silently store the password as plain
// text, and every login would then fail bcrypt.compare() with a 401.
const upsertUser = async (email, fields) => {
  let user = await User.findOne({ email });
  if (user) {
    Object.assign(user, fields);
    // Only re-hash if we're intentionally resetting it — otherwise re-running
    // the seed script would re-hash an already-hashed password on every run
    // (bcrypt.hash of a hash still "works" but changes the value each time,
    // which is harmless here since we always set the same plaintext, but
    // being explicit is safer).
  } else {
    user = new User({ email, ...fields });
  }
  await user.save(); // triggers the pre("save") hashing hook
  return user;
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  logger.info("Connected for seeding...");

  const admin = await upsertUser("admin@store.com", {
    name: "Store Admin",
    password: "Admin@12345",
    role: "super_admin",
    isEmailVerified: true,
  });

  const customer = await upsertUser("customer@store.com", {
    name: "Test Customer",
    password: "Customer@123",
    role: "customer",
    isEmailVerified: true,
  });

  const categoryDefs = [
    { name: "Electronics", slug: "electronics" },
    { name: "Fashion", slug: "fashion" },
    { name: "Home & Living", slug: "home-living" },
    { name: "Sports & Outdoors", slug: "sports-outdoors" },
  ];
  const categories = {};
  for (const def of categoryDefs) {
    categories[def.slug] = await Category.findOneAndUpdate(
      { slug: def.slug },
      def,
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );
  }

  const brandDefs = [
    { name: "Nike", slug: "nike" },
    { name: "Samsung", slug: "samsung" },
    { name: "Generic", slug: "generic" },
  ];
  const brands = {};
  for (const def of brandDefs) {
    brands[def.slug] = await Brand.findOneAndUpdate({ slug: def.slug }, def, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
  }

  const productDefs = [
    {
      title: 'Gaming Laptop 15" — RTX 4060',
      slug: "gaming-laptop-15-rtx-4060",
      category: categories["electronics"]._id,
      brand: brands["samsung"]._id,
      basePrice: 95000,
      shortDescription:
        "15-inch gaming laptop with RTX 4060, 16GB RAM, 512GB SSD.",
      description:
        "A powerful gaming laptop built for high-FPS play and creative work alike.",
      stock: 12,
      tags: ["laptop", "gaming", "electronics"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800",
          alt: "Gaming laptop",
        },
      ],
    },
    {
      title: "Running Shoes — Air Max Style",
      slug: "running-shoes-air-max-style",
      category: categories["sports-outdoors"]._id,
      brand: brands["nike"]._id,
      basePrice: 6500,
      shortDescription: "Lightweight running shoes with responsive cushioning.",
      description:
        "Built for daily runs — breathable mesh upper, durable rubber outsole.",
      hasVariants: true,
      variants: [
        {
          sku: "SHOE-BLU-42",
          attributes: { color: "Blue", size: "42" },
          price: 6500,
          stock: 8,
        },
        {
          sku: "SHOE-BLK-42",
          attributes: { color: "Black", size: "42" },
          price: 6500,
          stock: 5,
        },
        {
          sku: "SHOE-BLU-43",
          attributes: { color: "Blue", size: "43" },
          price: 6800,
          stock: 3,
        },
      ],
      tags: ["shoes", "running", "blue"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
          alt: "Running shoes",
        },
      ],
    },
    {
      title: "Office Chair — Ergonomic Mesh",
      slug: "office-chair-ergonomic-mesh",
      category: categories["home-living"]._id,
      brand: brands["generic"]._id,
      basePrice: 8500,
      shortDescription: "Ergonomic mesh-back office chair with lumbar support.",
      description:
        "Adjustable height and armrests, breathable mesh back for long work sessions.",
      stock: 20,
      tags: ["chair", "office", "furniture"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800",
          alt: "Office chair",
        },
      ],
    },
    {
      title: "Wireless Earbuds Pro",
      slug: "wireless-earbuds-pro",
      category: categories["electronics"]._id,
      brand: brands["samsung"]._id,
      basePrice: 4200,
      shortDescription:
        "Active noise-cancelling wireless earbuds, 24hr battery with case.",
      description:
        "Crisp audio, ANC, and a compact charging case that fits in any pocket.",
      stock: 40,
      isFeatured: true,
      tags: ["earbuds", "audio", "electronics"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800",
          alt: "Wireless earbuds",
        },
      ],
    },
  ];

  for (const def of productDefs) {
    await Product.findOneAndUpdate({ slug: def.slug }, def, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
  }

  await Coupon.findOneAndUpdate(
    { code: "WELCOME10" },
    {
      code: "WELCOME10",
      type: "first_order",
      value: 200,
      minPurchase: 1000,
      userLimit: 1,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const shippingZoneDefs = [
    { name: "Inside Dhaka", key: "inside_dhaka", charge: 70, isDefault: true, sortOrder: 0,
      description: "Dhaka city and immediate suburbs" },
    { name: "Outside Dhaka", key: "outside_dhaka", charge: 120, sortOrder: 1,
      description: "Anywhere outside Dhaka city" },
  ];
  for (const def of shippingZoneDefs) {
    await ShippingZone.findOneAndUpdate({ key: def.key }, def, {
      upsert: true, new: true, setDefaultsOnInsert: true,
    });
  }

  logger.info("Seed complete.");
  logger.info(`Admin login: admin@store.com / Admin@12345`);
  logger.info(`Customer login: customer@store.com / Customer@123`);
  logger.info(`Coupon: WELCOME10 (৳200 off, min ৳1000)`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  logger.error(`Seed failed: ${err.message}`);
  process.exit(1);
});
