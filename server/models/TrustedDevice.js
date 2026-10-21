import { getDb } from "../config/database.js";
import { toObjectId } from "./model-utils.js";

export default class TrustedDevice {
  static collection() {
    return getDb().collection("trusted_devices");
  }

  static async create({ userId, tokenHash, deviceName, expiresAt }) {
    const now = new Date();

    const record = {
      userId: toObjectId(userId, "user ID"),
      tokenHash,
      deviceName: deviceName || "Unknown device",
      createdAt: now,
      lastUsedAt: now,
      expiresAt,
      revokedAt: null,
    };

    const result = await this.collection().insertOne(record);
    return { ...record, _id: result.insertedId };
  }

  static async findActiveByHash(tokenHash) {
    return this.collection().findOne({
      tokenHash,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });
  }

  static async touch(id) {
    return this.collection().updateOne(
      { _id: toObjectId(id, "device ID"), revokedAt: null },
      { $set: { lastUsedAt: new Date() } },
    );
  }

  static async revoke(id, userId) {
    const result = await this.collection().updateOne(
      {
        _id: toObjectId(id, "device ID"),
        userId: toObjectId(userId, "user ID"),
        revokedAt: null,
      },
      {
        $set: {
          revokedAt: new Date(),
          tokenHash: null,
        },
      },
    );

    return result.modifiedCount === 1;
  }

  static async revokeAllForUser(userId) {
    return this.collection().updateMany(
      {
        userId: toObjectId(userId, "user ID"),
        revokedAt: null,
      },
      {
        $set: {
          revokedAt: new Date(),
          tokenHash: null,
        },
      },
    );
  }
}
