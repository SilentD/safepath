import { getDb } from "../config/database.js";
import { toObjectId } from "./model-utils.js";

export default class Evidence {
  static collection() {
    return getDb().collection("evidence_vault");
  }

  static async create(data) {
    const now = new Date();

    const record = {
      userId: toObjectId(data.userId, "user ID"),
      fileId: data.fileId,
      fileHash: data.fileHash,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      originalName: data.originalName,
      locationLat: data.locationLat ?? null,
      locationLng: data.locationLng ?? null,
      createdAt: now,
    };

    const result = await this.collection().insertOne(record);

    return {
      _id: result.insertedId,
      ...record,
    };
  }

  static async findByIdForUser(id, userId) {
    return this.collection().findOne({
      _id: toObjectId(id, "evidence ID"),
      userId: toObjectId(userId, "user ID"),
    });
  }
}
