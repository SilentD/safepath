import DirectoryEntry from "../models/DirectoryEntry.js";

function actorId(req) {
  const id = req.user?.id ?? req.user?.uid ?? req.user?._id;

  if (id === undefined || id === null || String(id).trim() === "") {
    throw Object.assign(
      new Error("Authenticated user identity is unavailable."),
      { statusCode: 401 },
    );
  }

  return String(id);
  0;
}

export default class DirectoryController {
  static async list(req, res, next) {
    try {
      const result = await DirectoryEntry.listPublic({
        category: req.query.category,
        province: req.query.province,
        search: req.query.search,
        page: req.query.page,
        limit: req.query.limit,
      });

      return res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const entry = await DirectoryEntry.findPublicById(req.params.id);

      if (!entry) {
        return res.status(404).json({
          success: false,
          message: "Support entry not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data: entry,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async adminList(req, res, next) {
    try {
      const result = await DirectoryEntry.listAdmin({
        category: req.query.category,
        province: req.query.province,
        search: req.query.search,
        status: req.query.status ?? "all",
        page: req.query.page,
        limit: req.query.limit,
      });

      return res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const entry = await DirectoryEntry.create(req.body, actorId(req));

      return res.status(201).json({
        success: true,
        message: "Support entry created and awaiting verification.",
        data: entry,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const entry = await DirectoryEntry.updateDetails(
        req.params.id,
        req.body,
        actorId(req),
      );

      if (!entry) {
        return res.status(404).json({
          success: false,
          message: "Support entry not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Support entry updated.",
        data: entry,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async setVerification(req, res, next) {
    try {
      const entry = await DirectoryEntry.setVerification(
        req.params.id,
        req.body.verified,
        actorId(req),
      );

      if (!entry) {
        return res.status(404).json({
          success: false,
          message: "Support entry not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: entry.verified
          ? "Support entry verified."
          : "Support entry verification removed.",
        data: entry,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async deactivate(req, res, next) {
    try {
      const entry = await DirectoryEntry.deactivate(
        req.params.id,
        actorId(req),
      );

      if (!entry) {
        return res.status(404).json({
          success: false,
          message: "Support entry not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Support entry deactivated.",
        data: entry,
      });
    } catch (error) {
      return next(error);
    }
  }
}
