import { getDb } from "../config/database.js";
import { toObjectId } from "./model-utils.js";

export default class Session {
  discreet = {
    isDiscreetLocked: "",
    discreetActivatedAt: "",
  };
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
      isDiscreetLocked: false,
      discreetActivatedAt: null,
      lastUsedAt: now,
      expiresAt,
      revokedAt: null,
    };

    const result = await this.collection().insertOne(record);

    return { ...record, _id: result.insertedId };
  }

  static async findById(id) {
    return this.collection().findOne({
      _id: toObjectId(id, "session ID"),
    });
  }
  static async findByIdAndUpdate(
    id,
    { isDiscreetLocked, discreetActivatedAt },
  ) {
    return this.collection().updateOne(
      {
        _id: toObjectId(id),
        active: true,
      },
      {
        $set: {
          isDiscreetLocked: true,
          discreetActivatedAt: new Date(),
        },
      },
    );
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
