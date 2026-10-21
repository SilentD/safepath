import { getDb } from "../config/database.js";
import { toObjectId, requireString } from "./model-utils.js";

const CATEGORIES = ["SAPS", "GBV Shelter", "Legal Aid"];

const EDITABLE_FIELDS = ["name", "category", "phone", "address", "province"];

function httpError(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateCategory(category) {
  if (!CATEGORIES.includes(category)) {
    throw httpError(`Category must be one of: ${CATEGORIES.join(", ")}.`);
  }
}

function normalizePagination(page, limit) {
  const parsedPage = Number(page ?? 1);
  const parsedLimit = Number(limit ?? 20);

  if (!Number.isInteger(parsedPage) || parsedPage < 1) {
    throw httpError("Page must be a positive integer.");
  }

  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    throw httpError("Limit must be an integer between 1 and 100.");
  }

  return { page: parsedPage, limit: parsedLimit };
}

function buildSearchFilter(search) {
  if (typeof search !== "string" || !search.trim()) {
    return {};
  }

  const term = search.trim();

  if (term.length > 100) {
    throw httpError("Search text cannot exceed 100 characters.");
  }

  const expression = new RegExp(escapeRegex(term), "i");

  return {
    $or: [
      { name: expression },
      { address: expression },
      { province: expression },
      { category: expression },
    ],
  };
}

function buildFilter({ category, province, search } = {}) {
  const filter = {};

  if (category !== undefined) {
    validateCategory(category);
    filter.category = category;
  }

  if (province !== undefined) {
    filter.province = requireString(province, "Province");
  }

  return { ...filter, ...buildSearchFilter(search) };
}

export default class DirectoryEntry {
  static collection() {
    return getDb().collection("directory");
  }

  static async create(data, actorId) {
    const category = requireString(data.category, "Category");
    validateCategory(category);

    const entry = {
      name: requireString(data.name, "Organization name"),
      category,
      phone: requireString(data.phone, "Phone number"),
      address: requireString(data.address, "Address"),
      province: requireString(data.province, "Province"),
      verified: false,
      active: true,
      createdBy: actorId,
      updatedBy: actorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.collection().insertOne(entry);

    return { ...entry, _id: result.insertedId };
  }

  static async listPublic(options = {}) {
    const { page, limit } = normalizePagination(options.page, options.limit);

    const filter = {
      active: { $ne: false },
      verified: true,
      ...buildFilter(options),
    };

    const [items, total] = await Promise.all([
      this.collection()
        .find(filter)
        .project({ createdBy: 0, updatedBy: 0 })
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),

      this.collection().countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async findPublicById(id) {
    return this.collection().findOne(
      {
        _id: toObjectId(id, "directory entry ID"),
        active: { $ne: false },
        verified: true,
      },
      {
        projection: { createdBy: 0, updatedBy: 0 },
      },
    );
  }

  static async listAdmin(options = {}) {
    const { page, limit } = normalizePagination(options.page, options.limit);

    const filter = buildFilter(options);

    if (options.status === "active") {
      filter.active = { $ne: false };
    } else if (options.status === "inactive") {
      filter.active = false;
    } else if (options.status === "verified") {
      filter.verified = true;
    } else if (options.status === "unverified") {
      filter.verified = false;
    } else if (options.status !== undefined && options.status !== "all") {
      throw httpError(
        "Status must be active, inactive, verified, unverified, or all.",
      );
    }

    const [items, total] = await Promise.all([
      this.collection()
        .find(filter)
        .sort({ updatedAt: -1, name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),

      this.collection().countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async updateDetails(id, data, actorId) {
    const changes = {};

    for (const field of EDITABLE_FIELDS) {
      if (data[field] !== undefined) {
        changes[field] = requireString(data[field], field);

        if (field === "category") {
          validateCategory(changes[field]);
        }
      }
    }

    if (Object.keys(changes).length === 0) {
      throw httpError("Provide at least one editable field.");
    }

    changes.updatedAt = new Date();
    changes.updatedBy = actorId;

    return this.collection().findOneAndUpdate(
      { _id: toObjectId(id, "directory entry ID") },
      { $set: changes },
      { returnDocument: "after" },
    );
  }

  static async setVerification(id, verified, actorId) {
    if (typeof verified !== "boolean") {
      throw httpError('"verified" must be a boolean.');
    }

    return this.collection().findOneAndUpdate(
      { _id: toObjectId(id, "directory entry ID") },
      {
        $set: {
          verified,
          updatedBy: actorId,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );
  }

  static async deactivate(id, actorId) {
    return this.collection().findOneAndUpdate(
      { _id: toObjectId(id, "directory entry ID") },
      {
        $set: {
          active: false,
          verified: false,
          updatedBy: actorId,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );
  }
}
