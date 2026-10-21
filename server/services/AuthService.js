import bcrypt from "bcryptjs";
import { randomBytes, randomInt, createHash } from "node:crypto";
import { getDb } from "../config/database.js";
import { toObjectId } from "../models/model-utils.js";
import User from "../models/User.js";
import Session from "../models/Session.js";
import TrustedDevice from "../models/TrustedDevice.js";
import AuthTokenService from "./AuthTokenService.js";
import AuthEmailService from "./AuthEmailService.js";

const db = () => getDb();
const challenges = () => db().collection("auth_challenges");
const resets = () => db().collection("password_resets");
const devices = () => db().collection("trusted_devices");

function httpError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

function emailValue(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function requirePassword(value) {
  if (typeof value !== "string" || value.length < 12 || value.length > 128) {
    throw httpError(400, "Password must be between 12 and 128 characters.");
  }
  return value;
}

function codeExpiry() {
  const minutes = Number(process.env.AUTH_CODE_MINUTES || 10);
  return new Date(Date.now() + minutes * 60_000);
}

function tokenExpiry(days) {
  return new Date(Date.now() + days * 86_400_000);
}

function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge,
  };
}

function setRefreshCookie(res, token, days) {
  res.cookie("safepath_refresh", token, cookieOptions(days * 86_400_000));
}

function setDeviceCookie(res, token, days) {
  res.cookie("safepath_device", token, cookieOptions(days * 86_400_000));
}

function clearRefreshCookie(res) {
  res.clearCookie("safepath_refresh", {
    path: "/api/auth",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

function clearDeviceCookie(res) {
  res.clearCookie("safepath_device", {
    path: "/api/auth",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

function codeHash(code) {
  return bcrypt.hash(code, 10);
}

async function createChallenge(user, purpose) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const now = new Date();

  const record = {
    userId: user._id,
    purpose,
    codeHash: await codeHash(code),
    attempts: 0,
    createdAt: now,
    lastSentAt: now,
    expiresAt: codeExpiry(),
    consumedAt: null,
  };

  const result = await challenges().insertOne(record);

  try {
    await AuthEmailService.sendCode({
      to: user.email,
      code,
      purpose,
    });
  } catch {
    await challenges().updateOne(
      { _id: result.insertedId, consumedAt: null },
      { $set: { consumedAt: new Date(), codeHash: null } },
    );
    throw httpError(
      503,
      "Verification email could not be sent. Try again later.",
    );
  }

  return result.insertedId.toString();
}

async function enforceResendCooldown(userId, purpose) {
  const previous = await challenges()
    .find({ userId, purpose })
    .sort({ createdAt: -1 })
    .limit(1)
    .next();

  const cooldown = Number(process.env.AUTH_RESEND_COOLDOWN_SECONDS || 60);

  if (previous && Date.now() - previous.createdAt.getTime() < cooldown * 1000) {
    throw httpError(429, "Please wait before requesting another code.");
  }
}

async function issueSession(user, res, trustedDevice = false) {
  const days = Number(process.env.REFRESH_TOKEN_DAYS || 30);
  const refreshToken = AuthTokenService.createOpaqueToken();

  const session = await Session.create({
    userId: user._id,
    refreshTokenHash: AuthTokenService.hash(refreshToken),
    expiresAt: tokenExpiry(days),
    deviceName: "Browser session",
  });

  setRefreshCookie(res, refreshToken, days);

  if (trustedDevice) {
    const deviceDays = Number(process.env.TRUSTED_DEVICE_DAYS || 30);
    const deviceToken = AuthTokenService.createOpaqueToken();

    await TrustedDevice.create({
      userId: user._id,
      tokenHash: AuthTokenService.hash(deviceToken),
      deviceName: "Trusted browser",
      expiresAt: tokenExpiry(deviceDays),
    });

    setDeviceCookie(res, deviceToken, deviceDays);
  }

  const accessToken = AuthTokenService.createAccessToken(user, session._id);

  return {
    accessToken,
    tokenType: "Bearer",
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    sessionUser: User.toSessionUser(user),
  };
}

export default class AuthService {
  static async signup(input) {
    const email = emailValue(input.email);
    const phoneNumber =
      typeof input.phoneNumber === "string" ? input.phoneNumber.trim() : "";
    const fullName =
      typeof input.fullName === "string" ? input.fullName.trim() : "";
    const password = requirePassword(input.password);

    if (!email || !email.includes("@") || !phoneNumber || !fullName) {
      throw httpError(
        400,
        "Name, email, phone number, and password are required.",
      );
    }

    if (await User.findByEmail(email)) {
      return {
        message: "The account cannot be registered, use a different email.",
      };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let user;

    try {
      user = await User.create({
        email,
        phoneNumber,
        fullName,
        passwordHash,
        emergencyContacts: [],
      });
    } catch (error) {
      throw error;
    }

    const challengeId = await createChallenge(user, "signup");

    return {
      message:
        "If the account can be registered, a verification email will be sent.",
      challenge: challengeId,
    };
  }

  static async verifyEmail({ challengeId, code }) {
    return this.verifyChallenge({ challengeId, code, purpose: "signup" });
  }

  static async resendVerification({ challengeId }) {
    const previous = await findChallenge(challengeId, "signup");

    if (!previous) {
      throw httpError(400, "Challenge is invalid or expired.");
    }

    await enforceResendCooldown(previous.userId, "signup");

    const user = await User.findById(previous.userId);

    if (!user || user.emailVerified || user.active === false) {
      throw httpError(400, "Challenge is invalid or expired.");
    }

    await AuthChallengeInvalidate(user._id, "signup");
    const newChallengeId = await createChallenge(user, "signup");

    return {
      challengeId: newChallengeId,
      message: "A replacement verification code has been sent.",
    };
  }
  static async login({ input, deviceCookie, userAgent, res }) {
    const identifier = emailValue(input.email);
    const password = input.password;

    const user = identifier ? await User.findByEmail(identifier) : null;

    if (!user || !user.passwordHash || user.active === false) {
      throw httpError(401, "Invalid email or password.");
    }

    if (!(await bcrypt.compare(password || "", user.passwordHash))) {
      throw httpError(401, "Invalid email or password.");
    }

    if (!user.emailVerified) {
      throw httpError(403, "Verify your email before signing in.");
    }

    if (deviceCookie) {
      const device = await TrustedDevice.findActiveByHash(
        AuthTokenService.hash(deviceCookie),
      );

      if (device && device.userId.toString() === user._id.toString()) {
        await TrustedDevice.touch(device._id);
        return issueSession(user, res, false);
      }
    }

    await enforceResendCooldown(user._id, "login");
    await AuthChallengeInvalidate(user._id, "login");
    const challengeId = await createChallenge(user, "login");

    return {
      requiresTwoFactor: true,
      challengeId,
      message: "A verification code has been sent to your email.",
    };
  }

  static async verify2FA({ challengeId, code, res }) {
    const result = await this.verifyChallenge({
      challengeId,
      code,
      purpose: "login",
    });

    return issueSession(result.user, res, true);
  }

  static async resend2FA({ challengeId }) {
    const challenge = await findChallenge(challengeId, "login");

    if (!challenge) {
      throw httpError(400, "Challenge is invalid or expired.");
    }

    await enforceResendCooldown(challenge.userId, "login");

    const user = await User.findById(challenge.userId);

    if (!user || !user.emailVerified || user.active === false) {
      throw httpError(400, "Challenge is invalid or expired.");
    }

    await AuthChallengeInvalidate(user._id, "login");
    const newChallengeId = await createChallenge(user, "login");

    return {
      challengeId: newChallengeId,
      message: "If the challenge is valid, a new code has been sent.",
    };
  }

  static async verifyChallenge({ challengeId, code, purpose }) {
    if (
      typeof code !== "string" ||
      !/^\d{6}$/.test(code) ||
      typeof challengeId !== "string" ||
      !/^[a-f\d]{24}$/i.test(challengeId)
    ) {
      throw httpError(400, "Invalid verification code or challenge.");
    }

    const challenge = await findChallenge(challengeId, purpose);

    if (!challenge || !challenge.codeHash) {
      throw httpError(400, "Challenge is invalid or expired.");
    }

    const matches = await bcrypt.compare(code, challenge.codeHash);

    if (!matches) {
      await challenges().updateOne(
        {
          _id: challenge._id,
          consumedAt: null,
          attempts: { $lt: 5 },
        },
        { $inc: { attempts: 1 } },
      );

      throw httpError(401, "Invalid verification code.");
    }

    const consumed = await challenges().updateOne(
      {
        _id: challenge._id,
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

    if (consumed.modifiedCount !== 1) {
      throw httpError(400, "Challenge is invalid or expired.");
    }

    const user = await User.findById(challenge.userId);

    if (!user || user.active === false) {
      throw httpError(400, "Challenge is invalid or expired.");
    }

    if (purpose === "signup") {
      await User.collection().updateOne(
        { _id: user._id },
        {
          $set: {
            emailVerified: true,
            updatedAt: new Date(),
          },
        },
      );

      return {
        message: "Email verified. You can now sign in.",
      };
    }

    return { user };
  }

  static async refresh(refreshToken, res) {
    if (!refreshToken) {
      throw httpError(401, "Refresh session required.");
    }

    const oldHash = AuthTokenService.hash(refreshToken);
    const oldSession = await Session.findActiveByTokenHash(oldHash);

    if (!oldSession) {
      clearRefreshCookie(res);
      throw httpError(401, "Refresh session expired or revoked.");
    }

    const user = await User.findById(oldSession.userId);

    if (!user || user.active === false || !user.emailVerified) {
      await Session.revoke(oldSession._id, oldSession.userId);
      clearRefreshCookie(res);
      throw httpError(401, "Account unavailable.");
    }

    await Session.revoke(oldSession._id, oldSession.userId);
    return issueSession(user, res, false);
  }

  static async logout(reqUser) {
    return Session.revoke(reqUser.sessionId, reqUser.id);
  }

  static async forgotPassword({ email }) {
    const user = await User.findByEmail(emailValue(email));

    if (user && user.active !== false && user.emailVerified) {
      const token = randomBytes(32).toString("hex");
      const tokenHash = AuthTokenService.hash(token);
      const expiresAt = new Date(Date.now() + 15 * 60_000);

      await resets().insertOne({
        userId: user._id,
        tokenHash,
        expiresAt,
        consumedAt: null,
        createdAt: new Date(),
      });

      const baseUrl = process.env.CLIENT_URL;

      if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
        throw httpError(503, "Password recovery is not configured.");
      }

      const resetUrl = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;

      await AuthEmailService.sendPasswordReset({
        to: user.email,
        resetUrl,
      });
    }

    return {
      message:
        "If the account exists, password recovery instructions will be sent.",
    };
  }

  static async resetPassword({ token, newPassword }) {
    if (typeof token !== "string" || token.length < 32) {
      throw httpError(400, "Reset token is invalid or expired.");
    }

    const record = await resets().findOne({
      tokenHash: AuthTokenService.hash(token),
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      throw httpError(400, "Reset token is invalid or expired.");
    }

    const passwordHash = await bcrypt.hash(requirePassword(newPassword), 12);

    const consumed = await resets().updateOne(
      {
        _id: record._id,
        consumedAt: null,
        expiresAt: { $gt: new Date() },
      },
      { $set: { consumedAt: new Date(), tokenHash: null } },
    );

    if (consumed.modifiedCount !== 1) {
      throw httpError(400, "Reset token is invalid or expired.");
    }

    await User.collection().updateOne(
      { _id: record.userId },
      { $set: { passwordHash, updatedAt: new Date() } },
    );

    await Session.revokeAllForUser(record.userId);
    await TrustedDevice.revokeAllForUser(record.userId);

    return {
      message: "Password reset successfully. Please sign in again.",
    };
  }

  static async changePassword({ userId, currentPassword, newPassword }) {
    const user = await User.findById(userId);

    if (
      !user ||
      !(await bcrypt.compare(currentPassword || "", user.passwordHash || ""))
    ) {
      throw httpError(401, "Current password is incorrect.");
    }

    const passwordHash = await bcrypt.hash(requirePassword(newPassword), 12);

    await User.collection().updateOne(
      { _id: user._id },
      { $set: { passwordHash, updatedAt: new Date() } },
    );

    await Session.revokeAllForUser(user._id);
    await TrustedDevice.revokeAllForUser(user._id);

    return {
      message: "Password changed. Please sign in again.",
    };
  }
}

async function findChallenge(id, purpose) {
  if (typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id)) {
    return null;
  }

  return challenges().findOne({
    _id: toObjectId(id, "challenge ID"),
    purpose,
    consumedAt: null,
    expiresAt: { $gt: new Date() },
    attempts: { $lt: 5 },
  });
}

async function AuthChallengeInvalidate(userId, purpose) {
  return challenges().updateMany(
    {
      userId,
      purpose,
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    },
    {
      $set: {
        consumedAt: new Date(),
        codeHash: null,
      },
    },
  );
}
