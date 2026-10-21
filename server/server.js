import "dotenv/config";
import app from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { ensureIndexes } from "./models/indexes.js";
import BackgroundWorker from "./services/BackgroundWorker.js";

const PORT = Number(process.env.PORT) || 3000;
const worker = new BackgroundWorker(5000);

let server;

async function startServer() {
  try {
    await connectDatabase();
    await ensureIndexes();

    server = app.listen(PORT, () => {
      console.log(`SafePath API listening on port ${PORT}`);
    });

    worker.start();
  } catch (error) {
    console.error("SafePath startup failed:", error.message);
    process.exitCode = 1;
  }
}

async function shutdown() {
  console.log("Shutting down SafePath API...");

  await worker.stop();

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await disconnectDatabase();
  process.exit(0);
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

startServer();
