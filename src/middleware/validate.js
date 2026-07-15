import { ApiError } from "../utils/ApiError.js";

// Usage: router.post("/route", validate(schema), controller)
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const details = result.error.flatten().fieldErrors;
    throw new ApiError(400, "Validation failed.", details);
  }
  req.body = result.data;
  next();
};
