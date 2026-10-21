import AuthService from "../services/AuthService.js";
import User from "../models/User.js";

export default class AuthController {
  static async signup(req, res, next) {
    try {
      const result = await AuthService.signup(req.body);
      res.status(202).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async verifyEmail(req, res, next) {
    try {
      const result = await AuthService.verifyEmail(req.body);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async resendVerification(req, res, next) {
    try {
      const result = await AuthService.resendVerification(req.body);
      res.status(202).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const result = await AuthService.login({
        input: req.body,
        deviceCookie: req.cookies?.safepath_device,
        userAgent: req.get("user-agent") || "",
        res,
      });

      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async verify2FA(req, res, next) {
    try {
      const result = await AuthService.verify2FA({
        ...req.body,
        userAgent: req.get("user-agent") || "",
        res,
      });

      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async resend2FA(req, res, next) {
    try {
      const result = await AuthService.resend2FA(req.body);
      res.status(202).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req, res, next) {
    try {
      const result = await AuthService.refresh(
        req.cookies?.safepath_refresh,
        res,
      );
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      await AuthService.logout(req.user);
      res.clearCookie("safepath_refresh");
      res.clearCookie("safepath_device");
      res.status(200).json({
        success: true,
        message: "Logged out successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req, res, next) {
    try {
      const user = await User.findById(req.user.id);

      res.status(200).json({
        success: true,
        sessionUser: User.toSessionUser(user),
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const result = await AuthService.forgotPassword(req.body);
      res.status(202).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const result = await AuthService.resetPassword(req.body);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const result = await AuthService.changePassword({
        ...req.body,
        userId: req.user.id,
      });
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}
