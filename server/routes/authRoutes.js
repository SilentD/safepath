import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import AuthController from "../controllers/AuthController.js";
import requireAuthentication from "../middleware/requireAuthentication.js";

const authRoutes = Router();

const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

const verificationLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

const resendLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

authRoutes.post("/signup", loginLimit, AuthController.signup);
authRoutes.post("/verify-email", verificationLimit, AuthController.verifyEmail);
authRoutes.post(
  "/resend-verification",
  resendLimit,
  AuthController.resendVerification,
);

authRoutes.post("/login", loginLimit, AuthController.login);
authRoutes.post("/verify-2fa", verificationLimit, AuthController.verify2FA);
authRoutes.post("/resend-2fa", resendLimit, AuthController.resend2FA);

authRoutes.post("/refresh", resendLimit, AuthController.refresh);
authRoutes.post("/logout", requireAuthentication, AuthController.logout);
authRoutes.get("/me", requireAuthentication, AuthController.me);

authRoutes.post("/forgot-password", resendLimit, AuthController.forgotPassword);
authRoutes.post(
  "/reset-password",
  verificationLimit,
  AuthController.resetPassword,
);
authRoutes.patch(
  "/change-password",
  requireAuthentication,
  AuthController.changePassword,
);

export default authRoutes;
