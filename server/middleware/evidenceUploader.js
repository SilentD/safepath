import multer from "multer";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

const allowedAudioTypes = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp4",
  "audio/aac",
  "audio/3gpp",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, tmpdir());
  },
  filename: (_req, _file, callback) => {
    callback(null, `safepath-${randomUUID()}.tmp`);
  },
});

function fileFilter(_req, file, callback) {
  if (!allowedAudioTypes.has(file.mimetype)) {
    return callback(
      Object.assign(new Error("Unsupported audio type."), { statusCode: 400 }),
    );
  }

  callback(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 1,
    fields: 4,
    parts: 5,
  },
});

export default upload;
