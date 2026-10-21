import { ObjectId } from "mongodb";

function validationError(message) {
  return Object.assign(new Error(message), { statusCode: 400 });
}

export function toObjectId(value, fieldName = "id") {
  if (value instanceof ObjectId) return value;

  if (typeof value !== "string" || !/^[a-f\d]{24}$/i.test(value)) {
    throw validationError(`Invalid ${fieldName}.`);
  }

  return new ObjectId(value);
}

export function requireString(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw validationError(`${fieldName} is required.`);
  }

  return value.trim();
}

export function requirePositiveInteger(value, fieldName) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw validationError(`${fieldName} must be a positive integer.`);
  }

  return value;
}
