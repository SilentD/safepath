import { Router } from "express";
import VaultController from "../controllers/vaultController.js";
import requireUser from "../middleware/requireUser.js";
import upload from "../middleware/evidenceUploader.js";

const vaultRoutes = Router();

// Real token/session verification must run before requireUser.
vaultRoutes.post(
  "/upload",
  requireUser,
  upload.single("audio"),
  VaultController.upload,
);

export default vaultRoutes;
