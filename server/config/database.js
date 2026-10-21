import { MongoClient } from "mongodb";

let client;
let database;

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing from environment configuration.");
  }

  client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  try {
    await client.connect();

    database = client.db(process.env.MONGODB_DB || "safepath");

    // Confirm the application can reach the database.
    await database.command({ ping: 1 });

    console.log("MongoDB connected successfully.");
    return database;
  } catch (error) {
    await client.close().catch(() => {});
    client = undefined;
    database = undefined;
    throw error;
  }
}

export function getDb() {
  if (!database) {
    throw new Error("Database is not connected. Start the database first.");
  }

  return database;
}

export async function disconnectDatabase() {
  if (client) {
    await client.close();
  }

  client = undefined;
  database = undefined;
}
