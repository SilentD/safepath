import { Router } from "express";
import rateLimit from "express-rate-limit";
import TimerController from "../controllers/timerController.js";
import requireUser from "../middleware/requireUser.js";

// Import and apply your actual token/session verification middleware
// before requireUser when authentication is available.

const timerRoutes = Router();
export function limits() {
  checkInLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many check-in attempts. Please try again later.",
    },
  });
  return checkInLimiter;
}

timerRoutes.post("/start", requireUser, TimerController.start);

timerRoutes.post(
  "/:timerId/checkin",
  requireUser,
  limits,
  TimerController.checkin,
);

export default timerRoutes;
