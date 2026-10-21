import { GridFSBucket, ObjectId } from "mongodb";
import { createReadStream } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { getDb } from "../config/database.js";

export default class EvidenceStorageService {
  static getBucket() {
    return new GridFSBucket(getDb(), {
      bucketName: "evidence_audio",
    });
  }

  static async store({ filePath, userId, mimeType }) {
    const bucket = this.getBucket();
    const fileId = new ObjectId();
    const hash = createHash("sha256");

    const hashStream = new Transform({
      transform(chunk, encoding, callback) {
        hash.update(chunk);
        callback(null, chunk);
      },
    });

    const uploadStream = bucket.openUploadStreamWithId(
      fileId,
      `evidence-${randomUUID()}`,
      {
        contentType: mimeType,
        metadata: {
          userId: String(userId),
          purpose: "safetypath-red-mode",
        },
      },
    );

    try {
      await pipeline(createReadStream(filePath), hashStream, uploadStream);

      return {
        fileId,
        fileHash: hash.digest("hex"),
      };
    } catch (error) {
      // Best-effort cleanup if a partial upload was created.
      await bucket.delete(fileId).catch(() => {});
      throw error;
    }
  }

  static async delete(fileId) {
    await this.getBucket().delete(fileId);
  }
}
