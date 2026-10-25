import bcrypt from "bcryptjs";
import Timer from "../models/Timer.js";
import { toObjectId } from "../models/model-utils.js";
import AlertService from "../services/NotificationService.js";

// Example inside your timer expiration check or background cron job:
function httpError(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

function validatePin(pin) {
  if (typeof pin !== "string" || !/^\d{6}$/.test(pin)) {
    throw httpError("PIN must contain exactly 6 digits.");
  }
}

function validateLocation(location) {
  if (location === undefined || location === null) {
    return { locationLat: null, locationLng: null };
  }

  const { latitude, longitude } = location;

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw httpError("GPS coordinates are invalid.");
  }

  return {
    locationLat: latitude,
    locationLng: longitude,
  };
}

export default class TimerService {
  static async start({ userId, durationMinutes, pin, gpsLocation }) {
    toObjectId(userId, "user ID");

    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 1 ||
      durationMinutes > 1440
    ) {
      throw httpError(
        "Duration must be a whole number between 1 and 1440 minutes.",
      );
    }

    validatePin(pin);

    const location = validateLocation(gpsLocation);
    const pinHash = await bcrypt.hash(pin, 12);

    return Timer.create({
      userId,
      durationSeconds: durationMinutes * 60,
      pinHash,
      ...location,
    });
  }

  static async checkIn({ timerId, userId, pin }) {
    validatePin(pin);

    const timer = await Timer.findActiveById(timerId, userId);

    if (!timer) {
      throw httpError("Active timer not found, expired, or unavailable.", 404);
    }

    const matches = await bcrypt.compare(pin, timer.pinHash);

    if (!matches) {
      throw httpError("Incorrect PIN.", 401);
    }

    const updated = await Timer.checkIn(timerId, userId);

    if (!updated) {
      throw httpError("Timer has already expired or been checked in.", 409);
    }

    return {
      timerId: String(updated._id),
      status: updated.status,
      checkedInAt: updated.updatedAt,
    };
  }

  // Example inside your timer expiration check or background cron job:
  static async handleTimerExpiration(timer) {
    try {
      // Update timer status to expired/alerted
      timer.status = "EXPIRED_ALERT_SENT";
      await timer.save();

      // Trigger Twilio SMS broadcast
      await NotificationService.triggerEmergencyAlert(timer.userId, {
        location: timer.location,
      });

      console.log(`Timer ${timer._id} expired and alert dispatched.`);
    } catch (err) {
      console.error(`Error handling timer expiration for ${timer._id}:`, err);
    }
  }
}
