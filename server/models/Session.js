import { getDb } from "../config/database.js";
import { toObjectId } from "./model-utils.js";

export default class Session {
  static collection() {
    return getDb().collection("sessions");
  }

  static async create({
    userId,
    refreshTokenHash,
    expiresAt,
    deviceName = "Unknown device",
  }) {
    const now = new Date();

    const record = {
      userId: toObjectId(userId, "user ID"),
      refreshTokenHash,
      deviceName,
      createdAt: now,
      lastUsedAt: now,
      expiresAt,
      revokedAt: null,
    };

    const result = await this.collection().insertOne(record);

    return { ...record, _id: result.insertedId };
  }

  static async findActiveByTokenHash(refreshTokenHash) {
    return this.collection().findOne({
      refreshTokenHash,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });
  }

  static async revoke(id, userId) {
    const result = await this.collection().updateOne(
      {
        _id: toObjectId(id, "session ID"),
        userId: toObjectId(userId, "user ID"),
        revokedAt: null,
      },
      {
        $set: {
          revokedAt: new Date(),
          refreshTokenHash: null,
          lastUsedAt: new Date(),
        },
      },
    );

    return result.modifiedCount === 1;
  }

  static async revokeAllForUser(userId) {
    const result = await this.collection().updateMany(
      {
        userId: toObjectId(userId, "user ID"),
        revokedAt: null,
      },
      {
        $set: {
          revokedAt: new Date(),
          refreshTokenHash: null,
          lastUsedAt: new Date(),
        },
      },
    );

    return result.modifiedCount;
  }
}
