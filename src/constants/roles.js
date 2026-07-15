export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  WAREHOUSE: "warehouse",
  MARKETING: "marketing",
  FINANCE: "finance",
  SUPPORT: "support",
  CUSTOMER: "customer",
};

// Simple permission-based map; extend per module as needed
export const PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ["*"],
  [ROLES.ADMIN]: ["product:*", "order:*", "inventory:*", "coupon:*", "customer:read"],
  [ROLES.WAREHOUSE]: ["inventory:*", "product:read", "order:read"],
  [ROLES.MARKETING]: ["coupon:*", "banner:*", "blog:*", "product:read"],
  [ROLES.FINANCE]: ["order:read", "payment:*", "refund:*"],
  [ROLES.SUPPORT]: ["order:read", "customer:read", "returnRequest:*"],
  [ROLES.CUSTOMER]: ["profile:own", "order:own", "wishlist:own", "review:own"],
};
