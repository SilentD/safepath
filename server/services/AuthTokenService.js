import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";

export default class AuthTokenService {
  static hash(value) {
    return createHash("sha256").update(value).digest("hex");
  }

  static createOpaqueToken() {
    return randomBytes(32).toString("hex");
  }

  static createCode() {
    // Cryptographically secure six-digit code.
    code = String(randomBytes(4).readUInt32BE(0) % 1_000_000).padStart(6, "0");
    return Number(code);
  }

  static createAccessToken(user, sessionId) {
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret || secret.length < 32) {
      throw new Error(
        "JWT_ACCESS_SECRET must be configured with a strong secret.",
      );
    }

    return jwt.sign(
      {
        role: user.role,
        sid: sessionId.toString(),
      },
      secret,
      {
        subject: user._id.toString(),
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "120m",
        issuer: "safepath-api",
        audience: "safepath-client",
      },
    );
  }

  static verifyAccessToken(token) {
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret || secret.length < 32) {
      throw new Error("JWT access-token configuration is invalid.");
    }

    return jwt.verify(token, secret, {
      issuer: "safepath-api",
      audience: "safepath-client",
      algorithms: ["HS256"],
    });
  }
}
