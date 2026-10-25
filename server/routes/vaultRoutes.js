import { Router } from "express";
import VaultController from "../controllers/vaultController.js";
import requireAuthentication from "../middleware/requireAuthentication.js";
import upload from "../middleware/evidenceUploader.js";

const vaultRoutes = Router();

// Require authentication for all Red Mode safety operations
vaultRoutes.use(requireAuthentication);

// Real token/session verification must run before requireUser.
vaultRoutes.post("/upload", upload.single("audio"), VaultController.upload);

// POST /api/safety/red-mode/trigger - Triggers emergency broadcast and locks session
vaultRoutes.post("/red-mode/trigger", VaultController.handleRedModeTrigger);

// POST /api/safety/red-mode/lock - Discreetly locks active UI session state
vaultRoutes.post("/red-mode/lock", VaultController.handleRedModeLock);

export default vaultRoutes;
