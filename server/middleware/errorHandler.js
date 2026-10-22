// errorHandler.js
export function errorHandler(err, req, res, next) {
  // Log the error for debugging purposes (you can replace this with a logger like Winston/Pino later)
  console.error(`[Error] ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Determine status code (default to 500 if not set)
  const statusCode = err.status || err.statusCode || 500;

  // Send structured JSON response back to the frontend
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    // Optionally include stack trace only in development mode
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
