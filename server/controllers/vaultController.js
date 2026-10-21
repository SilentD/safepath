import EvidenceService from "../services/EvidenceService.js";

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
}
