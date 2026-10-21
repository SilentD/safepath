import { getDb } from "../config/database.js";
import { toObjectId } from "./model-utils.js";

export default class AuthChallenge {
  static collection() {
    return getDb().collection("auth_challenges");
  }

  static async invalidateActive(userId, purpose) {
    const now = new Date();

    return this.collection().updateMany(
      {
        userId: toObjectId(userId, "user ID"),
        purpose,
        consumedAt: null,
        expiresAt: { $gt: now },
      },
      {
        $set: {
          consumedAt: now,
          codeHash: null,
          invalidatedAt: now,
        },
      },
    );
  }

  static async create({ userId, purpose, codeHash, expiresAt }) {
    const record = {
      userId: toObjectId(userId, "user ID"),
      purpose,
      codeHash,
      attempts: 0,
      expiresAt,
      consumedAt: null,
      createdAt: new Date(),
    };

    const result = await this.collection().insertOne(record);

    return { ...record, _id: result.insertedId };
  }

  static async findActive(id, userId, purpose) {
    return this.collection().findOne({
      _id: toObjectId(id, "challenge ID"),
      userId: toObjectId(userId, "user ID"),
      purpose,
      consumedAt: null,
      expiresAt: { $gt: new Date() },
      attempts: { $lt: 5 },
    });
  }

  static async recordFailure(id) {
    return this.collection().updateOne(
      {
        _id: toObjectId(id, "challenge ID"),
        consumedAt: null,
        expiresAt: { $gt: new Date() },
        attempts: { $lt: 5 },
      },
      { $inc: { attempts: 1 } },
    );
  }

  static async consume(id) {
    return this.collection().updateOne(
      {
        _id: toObjectId(id, "challenge ID"),
        consumedAt: null,
        expiresAt: { $gt: new Date() },
        attempts: { $lt: 5 },
      },
      {
        $set: {
          consumedAt: new Date(),
          codeHash: null,
        },
      },
    );
  }
}
