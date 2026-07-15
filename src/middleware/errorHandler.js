import logger from "../utils/logger.js";

export const notFound = (req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) logger.error(err.stack || err.message);
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    details: err.details || undefined,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};
