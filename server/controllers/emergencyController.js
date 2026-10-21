import User from "../models/User.js";
import NotificationService from "../services/NotificationService.js";

function badRequest(message) {
  return Object.assign(new Error(message), { statusCode: 400 });
}

export default class EmergencyController {
  static async sos(req, res, next) {
    try {
      const userId = req.user?.id ?? req.user?._id;

      if (!userId) {
        throw Object.assign(new Error("Authenticated user is required."), {
          statusCode: 401,
        });
      }

      const gpsLocation = req.body?.gpsLocation;
      const reason = req.body?.reason;

      if (
        reason !== undefined &&
        (typeof reason !== "string" || reason.length > 500)
      ) {
        throw badRequest("Reason must be text of at most 500 characters.");
      }

      if (gpsLocation !== undefined && gpsLocation !== null) {
        const { latitude, longitude } = gpsLocation;

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          latitude < -90 ||
          latitude > 90 ||
          longitude < -180 ||
          longitude > 180
        ) {
          throw badRequest("GPS coordinates are invalid.");
        }
      }

      const user = await User.findById(userId);

      if (!user) {
        throw Object.assign(new Error("User account was not found."), {
          statusCode: 404,
        });
      }

      const result = await NotificationService.sendSOS({
        user,
        location: gpsLocation,
        reason: reason?.trim(),
      });

      return res.status(202).json({
        success: true,
        message: "SOS request processed.",
        notificationMode: result.mode,
      });
    } catch (error) {
      return next(error);
    }
  }
}
