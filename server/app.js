import "dotenv/config";
import express from "express";
import apiRouter from "./routes/appRouter.js";
import errorHandler from "./middleware/errorHandler.js";
import cookieParser from "cookie-parser";
import cors from "cors";
const app = express();

app.disable("x-powered-by");

// After creating the Express app:
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// Keep your existing CORS middleware, routes and error handler.

// Mount your API router after middleware.
app.use("/api", apiRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

export default app;
