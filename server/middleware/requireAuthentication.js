import Session from "../models/Session.js";
import User from "../models/User.js";
import AuthTokenService from "../services/AuthTokenService.js";

export default async function requireAuthentication(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    let payload;

    try {
      payload = AuthTokenService.verifyAccessToken(token);
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired access token.",
      });
    }

    if (!payload.sub || !payload.sid) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token.",
      });
    }

    const { getDb } = await import("../config/database.js");
    const { toObjectId } = await import("../models/model-utils.js");
    const db = getDb();

    const session = await db.collection("sessions").findOne({
      _id: toObjectId(payload.sid, "session ID"),
      userId: toObjectId(payload.sub, "user ID"),
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session expired or revoked.",
      });
    }

    const user = await User.findById(payload.sub);

    if (!user || user.active === false || !user.emailVerified) {
      return res.status(401).json({
        success: false,
        message: "Account unavailable.",
      });
    }

    req.user = {
      id: user._id.toString(),
      _id: user._id,
      role: user.role,
      sessionId: session._id.toString(),
    };

    return next();
  } catch (error) {
    return next(error);
  }
}
