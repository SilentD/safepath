import { Router } from "express";
import directoryRoutes from "./directoryRoutes.js";
import authRoutes from "./authRoutes.js";
import timerRoutes from "./timerRoutes.js";
import vaultRoutes from "./vaultRoutes.js";
import adminRoutes from "./adminRoutes.js";
import userRoutes from "./userRoutes.js";
import emergencyRoutes from "./emergencyRoutes.js";

import { getDb } from "../config/database.js";

// Keep your existing feature-route imports here.

const apiRouter = Router();

apiRouter.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SafePath API is running.",
  });
});

apiRouter.get("/health/db", async (req, res) => {
  try {
    await getDb().command({ ping: 1 });

    res.status(200).json({
      success: true,
      database: "connected",
    });
  } catch {
    res.status(503).json({
      success: false,
      database: "unavailable",
    });
  }
});
apiRouter.use("/auth", authRoutes);
apiRouter.use("/directory", directoryRoutes);
apiRouter.use("/ping", timerRoutes);
apiRouter.use("/vault", vaultRoutes);
apiRouter.use("/emergency", emergencyRoutes);
apiRouter.use("/admin", adminRoutes);
apiRouter.use("/user", userRoutes);

export default apiRouter;
