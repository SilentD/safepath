import { unlink } from "node:fs/promises";
import { toObjectId } from "../models/model-utils.js";
import Evidence from "../models/Evidence.js";
import EvidenceStorageService from "./EvidenceStorageService.js";

export default class EvidenceService {
  static async upload({ userId, file, gpsLocation }) {
    const ownerId = toObjectId(userId, "user ID");

    if (!file?.path || !file.size) {
      throw Object.assign(new Error("A non-empty audio file is required."), {
        statusCode: 400,
      });
    }

    let storedFile;

    try {
      storedFile = await EvidenceStorageService.store({
        filePath: file.path,
        userId: ownerId,
        mimeType: file.mimetype,
      });

      try {
        const location = gpsLocation || {};

        return await Evidence.create({
          userId: ownerId,
          fileId: storedFile.fileId,
          fileHash: storedFile.fileHash,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          originalName: file.originalname,
          locationLat: location.latitude ?? null,
          locationLng: location.longitude ?? null,
        });
      } catch (error) {
        await EvidenceStorageService.delete(storedFile.fileId).catch(
          (cleanupError) => {
            console.error("Evidence cleanup failed:", cleanupError.message);
          },
        );

        throw error;
      }
    } finally {
      await unlink(file.path).catch(() => {});
    }
  }
}
