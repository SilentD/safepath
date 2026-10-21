import { Router } from "express";
import EmergencyController from "../controllers/emergencyController.js";
import requireUser from "../middleware/requireUser.js";

const emergencyRoutes = Router();

// The real authentication/token-verification middleware must run
// before requireUser. Do not expose this route without it.
emergencyRoutes.post("/sos", requireUser, EmergencyController.sos);

export default emergencyRoutes;
