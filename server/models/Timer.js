import { getDb } from "../config/database.js";
import { toObjectId, requirePositiveInteger } from "./model-utils.js";

export default class Timer {
  static collection() {
    return getDb().collection("timers");
  }

  static async create(data) {
    const now = new Date();
    const durationSeconds = requirePositiveInteger(
      data.durationSeconds,
      "Duration",
    );

    const timer = {
      userId: toObjectId(data.userId, "user ID"),
      status: "active",
      durationSeconds,
      pinHash: data.pinHash,
      expiresAt: new Date(now.getTime() + durationSeconds * 1000),
      locationLat: data.locationLat ?? null,
      locationLng: data.locationLng ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.collection().insertOne(timer);

    return {
      _id: result.insertedId,
      userId: timer.userId,
      status: timer.status,
      durationSeconds: timer.durationSeconds,
      expiresAt: timer.expiresAt,
      locationLat: timer.locationLat,
      locationLng: timer.locationLng,
      createdAt: timer.createdAt,
    };
  }

  static async findActiveById(id, userId) {
    return this.collection().findOne({
      _id: toObjectId(id, "timer ID"),
      userId: toObjectId(userId, "user ID"),
      status: "active",
      expiresAt: { $gt: new Date() },
    });
  }

  static async checkIn(id, userId) {
    return this.collection().findOneAndUpdate(
      {
        _id: toObjectId(id, "timer ID"),
        userId: toObjectId(userId, "user ID"),
        status: "active",
        expiresAt: { $gt: new Date() },
      },
      {
        $set: {
          status: "checked_in",
          updatedAt: new Date(),
        },
        $unset: {
          pinHash: "",
        },
      },
      { returnDocument: "after" },
    );
  }

  static async expireDueTimers(batchSize = 100) {
    const now = new Date();

    const dueTimers = await this.collection()
      .find({
        status: "active",
        expiresAt: { $lte: now },
      })
      .project({ _id: 1 })
      .limit(batchSize)
      .toArray();

    let expiredCount = 0;

    for (const timer of dueTimers) {
      const result = await this.collection().updateOne(
        {
          _id: timer._id,
          status: "active",
          expiresAt: { $lte: now },
        },
        {
          $set: {
            status: "expired",
            expiredAt: now,
            notificationStatus: "pending",
            notificationAttempts: 0,
            updatedAt: now,
          },
          $unset: { pinHash: "" },
        },
      );

      expiredCount += result.modifiedCount;
    }

    return expiredCount;
  }

  static async findPendingNotifications(batchSize = 100) {
    return this.collection()
      .find({
        status: "expired",
        notificationStatus: "pending",
        notificationAttempts: { $lt: 5 },
      })
      .sort({ expiredAt: 1 })
      .limit(batchSize)
      .toArray();
  }

  static async beginNotificationAttempt(id) {
    return this.collection().findOneAndUpdate(
      {
        _id: toObjectId(id, "timer ID"),
        status: "expired",
        notificationStatus: "pending",
        notificationAttempts: { $lt: 5 },
      },
      {
        $inc: { notificationAttempts: 1 },
        $set: {
          notificationStatus: "sending",
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );
  }

  static async markNotificationResult(id, status, errorMessage = null) {
    const allowedStatuses = ["sent", "mocked", "pending", "failed"];

    if (!allowedStatuses.includes(status)) {
      throw Object.assign(new Error("Invalid notification status."), {
        statusCode: 400,
      });
    }

    const update = {
      $set: {
        notificationStatus: status,
        updatedAt: new Date(),
      },
    };

    if (errorMessage) {
      update.$set.lastNotificationError = String(errorMessage).slice(0, 300);
    } else {
      update.$unset = { lastNotificationError: "" };
    }

    return this.collection().updateOne(
      { _id: toObjectId(id, "timer ID") },
      update,
    );
  }
}
