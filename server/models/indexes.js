import { getDb } from "../config/database.js";

export async function ensureIndexes() {
  const db = getDb();

  await Promise.all([
    db
      .collection("users")
      .createIndex(
        { phoneNumber: 1 },
        { unique: true, name: "unique_user_phone" },
      ),

    db
      .collection("timers")
      .createIndex({ userId: 1, status: 1 }, { name: "timers_by_user_status" }),

    db.collection("timers").createIndex(
      {
        notificationStatus: 1,
        notificationAttempts: 1,
        expiredAt: 1,
      },
      { name: "pending_timer_notifications" },
    ),
    db
      .collection("timers")
      .createIndex(
        { expiresAt: 1, status: 1 },
        { name: "timers_by_expiry_status" },
      ),

    db
      .collection("evidence_vault")
      .createIndex(
        { userId: 1, createdAt: -1 },
        { name: "evidence_by_user_date" },
      ),

    db
      .collection("directory")
      .createIndex(
        { category: 1, verified: 1, name: 1, active: 1 },
        { name: "directory_active_verified_category_name" },
      ),

    db.collection("users").createIndex(
      { email: 1 },
      {
        unique: true,
        name: "unique_user_email",
        partialFilterExpression: {
          email: { $type: "string" },
        },
      },
    ),

    db.collection("sessions").createIndex(
      { refreshTokenHash: 1 },
      {
        unique: true,
        partialFilterExpression: {
          refreshTokenHash: { $type: "string" },
        },
        name: "unique_session_refresh_hash",
      },
    ),

    db
      .collection("sessions")
      .createIndex(
        { userId: 1, revokedAt: 1 },
        { name: "sessions_by_user_status" },
      ),

    db
      .collection("sessions")
      .createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0, name: "sessions_expiry_ttl" },
      ),

    db.collection("trusted_devices").createIndex(
      { tokenHash: 1 },
      {
        unique: true,
        partialFilterExpression: {
          tokenHash: { $type: "string" },
        },
        name: "unique_trusted_device_token_hash",
      },
    ),

    db
      .collection("trusted_devices")
      .createIndex(
        { userId: 1, revokedAt: 1 },
        { name: "trusted_devices_by_user" },
      ),

    db
      .collection("trusted_devices")
      .createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0, name: "trusted_devices_expiry_ttl" },
      ),

    db
      .collection("auth_challenges")
      .createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0, name: "auth_challenges_expiry_ttl" },
      ),

    db
      .collection("auth_challenges")
      .createIndex(
        { userId: 1, createdAt: -1 },
        { name: "auth_challenges_by_user" },
      ),
    db.collection("password_resets").createIndex(
      { tokenHash: 1 },
      {
        unique: true,
        partialFilterExpression: {
          tokenHash: { $type: "string" },
        },
        name: "unique_password_reset_token_hash",
      },
    ),

    db
      .collection("password_resets")
      .createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0, name: "password_resets_expiry_ttl" },
      ),
  ]);
}
