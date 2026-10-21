import BaseController from "./baseController.js";

export default class TimerController extends BaseController {
  static async start(req, res, next) {
    try {
      // Input validation and timer creation come next.
      return this.notImplemented(res, "Safety Ping start");
    } catch (error) {
      next(error);
    }
  }

  static async checkin(req, res, next) {
    try {
      // PIN verification and timer cancellation come next.
      return this.notImplemented(res, "Safety Ping check-in");
    } catch (error) {
      next(error);
    }
  }
}
