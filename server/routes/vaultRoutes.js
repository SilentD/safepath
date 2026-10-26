import { Router } from "express";
import VaultController from "../controllers/vaultController.js";
import requireAuthentication from "../middleware/requireAuthentication.js";
import upload from "../middleware/evidenceUploader.js";
import multer from "multer";

// Configure multer for temporary storage or memory buffer

const vaultRoutes = Router();
const insert = multer({
  limits: { fileSize: 25 * 1024 * 1024 }, // limit to 25MB for audio/video evidence
});

// Require authentication for all vault actions
vaultRoutes.use(requireAuthentication);

// POST /api/vault/upload
vaultRoutes.post(
  "/upload",
  insert.single("file"),
  VaultController.uploadVaultEvidence,
);

// POST /api/safety/red-mode/trigger - Triggers emergency broadcast and locks session
vaultRoutes.post("/red-mode/trigger", VaultController.handleRedModeTrigger);

// POST /api/safety/red-mode/lock - Discreetly locks active UI session state
vaultRoutes.post("/red-mode/lock", VaultController.handleRedModeLock);

export default vaultRoutes;
