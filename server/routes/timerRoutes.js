import { Router } from "express";
import rateLimit from "express-rate-limit";
import TimerController from "../controllers/timerController.js";
import requireAuthentication from "../middleware/requireAuthentication.js";

// Import and apply your actual token/session verification middleware
// before requireUser whn authentication is available.

const timerRoutes = Router();
export function limits() {
  checkInLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many check-in attempts. Please try again later.",
    },
  });
  return checkInLimiter;
}

timerRoutes.get(
  "/alerts/active",
  requireAuthentication,
  TimerController.getActiveAlerts,
);

timerRoutes.post(
  "/alerts/:alertId/respond",
  requireAuthentication,
  TimerController.respondToAlert,
);

timerRoutes.post("/start", requireAuthentication, TimerController.start);

timerRoutes.post(
  "/:timerId/checkin",
  requireAuthentication,
  TimerController.checkin,
);

export default timerRoutes;
