import BaseController from "./baseController.js";
import TimerService from "../services/TimerService.js";

export default class TimerController extends BaseController {
  static async start(req, res, next) {
    // Input validation and timer creation come next.
    try {
      const result = await TimerService.start(req.body);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async checkin(req, res, next) {
    // Input validation and timer creation come next.
    try {
      const result = await TimerService.checkIn(req.body);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}
