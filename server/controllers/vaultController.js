import EvidenceService from "../services/EvidenceService.js";
import AlertService from "../services/EmergencyService.js";
import Session from "../models/Session.js";
import EvidenceVault from "../models/Evidence.js";
import crypto from "crypto";

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
  // Helper to generate a simple file hash if needed
  static generateFileHash(buffer) {
    return crypto.createHash("sha256").update(buffer).digest("hex");
  }

  static async uploadVaultEvidence(req, res, next) {
    try {
      // Resolve user ID securely from auth middleware
      const userId = req.user?.id || req.user?._id || req.userId;
      const file = req.file; // Provided by multer middleware
      const { locationLat, locationLng } = req.body;

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized user session." });
      }

      if (!file) {
        return res
          .status(400)
          .json({ success: false, message: "No evidence file provided." });
      }

      const now = new Date();

      // Construct the evidence record matching your database schema
      const record = {
        userId: userId, // Adjust to toObjectId(userId, "user ID") if required by your model utils
        fileId: file.filename || file.path || `evidence-${Date.now()}`,
        fileHash: file.buffer ? generateFileHash(file.buffer) : "hash-pending",
        mimeType: file.mimetype || "audio/webm",
        sizeBytes: file.size || 0,
        originalName: file.originalname || "emergency-recording.webm",
        locationLat: locationLat ? parseFloat(locationLat) : null,
        locationLng: locationLng ? parseFloat(locationLng) : null,
        createdAt: now,
      };

      // Save to MongoDB Evidence Vault collection
      const savedRecord = await EvidenceVault.create(record);

      return res.status(201).json({
        success: true,
        message: "Evidence securely stored in vault.",
        evidenceId: savedRecord._id,
      });
    } catch (error) {
      console.error("[Vault Upload Error]:", error);
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
