export default class BaseController {
  notImplemented(res, feature) {
    return res.status(501).json({
      success: false,
      message: `${feature} is not implemented yet`,
    });
  }
}
