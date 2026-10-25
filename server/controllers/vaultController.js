import EvidenceService from "../services/EvidenceService.js";
import AlertService from "../services/EmergencyService.js";
import Session from "../models/Session.js";

function parseLocation(value) {
  if (value === undefined || value === "") return null;

  let location = value;

  if (typeof value === "string") {
    try {
      location = JSON.parse(value);
    } catch {
      throw Object.assign(new Error("gpsLocation must be valid JSON."), {
        statusCode: 400,
      });
    }
  }

  const { latitude, longitude } = location || {};

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw Object.assign(new Error("GPS coordinates are invalid."), {
      statusCode: 400,
    });
  }

  return { latitude, longitude };
}

export default class VaultController {
  static async upload(req, res, next) {
    try {
      const userId = req.user?.id ?? req.user?._id;

      if (!userId) {
        throw Object.assign(new Error("Authenticated user is required."), {
          statusCode: 401,
        });
      }

      if (!req.file) {
        throw Object.assign(
          new Error("Upload an audio file using the audio field."),
          { statusCode: 400 },
        );
      }

      const gpsLocation = parseLocation(req.body?.gpsLocation);

      const evidence = await EvidenceService.upload({
        userId,
        file: req.file,
        gpsLocation,
      });

      return res.status(201).json({
        success: true,
        message: "Evidence uploaded and integrity hash generated.",
        data: {
          evidenceId: evidence._id,
          fileHash: evidence.fileHash,
          mimeType: evidence.mimeType,
          sizeBytes: evidence.sizeBytes,
          createdAt: evidence.createdAt,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  static async handleRedModeTrigger(req, res, next) {
    try {
      const userId = req.user.id;
      const sessionId = req.user.sessionId;
      const { gpsLocation, note } = req.body;

      // 1. Dispatch emergency notifications to trusted contacts
      const alertResult = await AlertService.triggerEmergencyAlert(userId, {
        location: gpsLocation,
        triggerType: "RED_MODE_PANIC",
        note: note || "Red Mode panic trigger activated.",
      });

      // 2. Lock session state for discreet mode (if session tracking is active)
      if (sessionId) {
        await Session.findByIdAndUpdate(sessionId, {
          isDiscreetLocked: true,
          discreetActivatedAt: new Date(),
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Red Mode activated. Emergency contacts notified and session locked.",
        alertId: alertResult.alertId || null,
        notifiedContactsCount: alertResult.notifiedCount || 0,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return next(error);
    }
  }

  static async handleRedModeLock(req, res, next) {
    try {
      const sessionId = req.user.sessionId;

      if (sessionId) {
        await Session.findByIdAndUpdate(sessionId, {
          isDiscreetLocked: true,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Session locked in discreet mode.",
      });
    } catch (error) {
      return next(error);
    }
  }
}
