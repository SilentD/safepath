import express from "express";
import requireAuthentication from "../middleware/requireAuthentication.js";
import { getAdminAnalytics } from "../controllers/adminController.js";

const router = express.Router();

router.use(requireAuthentication);
router.get("/analytics", getAdminAnalytics);

export default router;
