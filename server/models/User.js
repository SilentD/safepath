import { getDb } from "../config/database.js";
import { requireString, toObjectId } from "./model-utils.js";

export default class User {
  static collection() {
    return getDb().collection("users");
  }

  static async create(data) {
    const phoneNumber = requireString(data.phoneNumber, "Phone number");

    const emergencyContacts = data.emergencyContacts ?? [];

    if (!Array.isArray(emergencyContacts)) {
      throw new Error("Emergency contacts must be an array.");
    }

    const contacts = emergencyContacts.map((contact) => ({
      name: requireString(contact.name, "Contact name"),
      phone: requireString(contact.phone, "Contact phone"),
      relation:
        typeof contact.relation === "string" ? contact.relation.trim() : "",
    }));

    const email =
      typeof data.email === "string" ? data.email.trim().toLowerCase() : null;

    const user = {
      phoneNumber,
      email,
      fullName: typeof data.fullName === "string" ? data.fullName.trim() : "",
      passwordHash: data.passwordHash ?? null,
      role: data.role ?? "user",
      emailVerified: false,
      active: true,
      emergencyContacts: contacts,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.collection().insertOne(user);

    return { ...user, _id: result.insertedId };
  }

  static async findById(id) {
    return this.collection().findOne({
      _id: toObjectId(id, "user ID"),
    });
  }

  static async findByEmail(email) {
    if (typeof email !== "string" || !email.trim()) {
      return null;
    }

    return this.collection().findOne({
      email: email.trim().toLowerCase(),
    });
  }

  static async findByPhoneNumber(phoneNumber) {
    if (typeof phoneNumber !== "string" || !phoneNumber.trim()) {
      return null;
    }

    return this.collection().findOne({
      phoneNumber: phoneNumber.trim(),
    });
  }

  static toSessionUser(user) {
    if (!user) return null;

    return {
      id: user._id.toString(),
      fullName: user.fullName ?? "",
      email: user.email ?? null,
      phoneNumber: user.phoneNumber,
      role: user.role,
      emailVerified: user.emailVerified === true,
    };
  }
}
