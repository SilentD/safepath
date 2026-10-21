import { Router } from "express";
import DirectoryController from "../controllers/directoryController.js";
import {
  requireAdmin,
  requireAuthentication,
} from "../middleware/directoryAccess.js";

// Import your real authentication middleware here.

//import requireAuthentication from "../middleware/requireAuthentication.js";

// It must verify the session/token and populate req.user.

const directoryRoutes = Router();

// Public: verified and active support entries only.
directoryRoutes.get("/", DirectoryController.list);
directoryRoutes.get("/:id", DirectoryController.getById);

// Admin: review the full directory.
directoryRoutes.get(
  "/admin",
  requireAuthentication,
  requireAdmin,
  DirectoryController.adminList,
);

// Admin: create an entry, initially unverified.
directoryRoutes.post(
  "/",
  requireAuthentication,
  requireAdmin,
  DirectoryController.create,
);

// Admin: update allowed organization details.
directoryRoutes.patch(
  "/:id",
  requireAuthentication,
  requireAdmin,
  DirectoryController.update,
);

// Admin: verify or unverify an entry.
directoryRoutes.patch(
  "/:id/verification",
  requireAuthentication,
  requireAdmin,
  DirectoryController.setVerification,
);
// Admin: soft-delete an entry.
directoryRoutes.delete(
  "/:id",
  requireAuthentication,
  requireAdmin,
  DirectoryController.deactivate,
);

export default directoryRoutes;
