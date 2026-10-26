import BaseController from "./baseController.js";
import TimerService from "../services/TimerService.js";

export default class TimerController extends BaseController {
  static async start(req, res, next) {
    // Input validation and timer creation come next.

    try {
      const result = await TimerService.start(req.body);
      // Inside your backend route or middleware:
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async checkin(req, res, next) {
    // Input validation and timer creation come next.
    try {
      const result = await TimerService.checkIn(req.body);

      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getActiveAlerts(req, res, next) {
    try {
      const userId = req.user?.id ?? req.user?._id;

      if (!userId) {
        return res.status(200).json([]);
      }
      // Find timers or alerts that are currently in an alert/expired state for this user
      // (or expand this query to include trusted circle members if applicable)
      let activeTimers;
      try {
        activeTimers = await Timer.findActive({
          userId: userId,
          status: { $in: ["EXPIRED_ALERT_SENT", "REDMODE_ACTIVE"] },
        });
      } catch (error) {
        return res
          .status(200)
          .json("Could not resolve active alerts for user: " + error.message);
      }

      // Map to frontend SafetyAlert interface structure
      const formattedAlerts = activeTimers.map((timer) => ({
        id: timer._id.toString(),
        userId: timer.userId.toString(),
        userName: "You / Trusted Contact",
        status: timer.status,
        location: timer.location || null,
        createdAt: timer.createdAt,
      }));

      return res.status(200).json(formattedAlerts);
    } catch (error) {
      return next(error.message);
    }
  }

  // Also wire up the "Help is on the way" response endpoint
  static async respondToAlert(req, res, next) {
    try {
      const { alertId } = req.params;
      const responderId = req.user?.id || req.user?._id || req.userId;

      if (!responderId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized responder." });
      }

      const result = await TimerService.handleAlertResponse(
        alertId,
        responderId,
      );

      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }
}
