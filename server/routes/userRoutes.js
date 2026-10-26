import express from "express";
import requireAuthentication from "../middleware/requireAuthentication.js";
import {
  getUserProfile,
  updateEmergencyContacts,
} from "../controllers/userController.js";

const router = express.Router();

router.use(requireAuthentication);
router.get("/profile", getUserProfile);
router.put("/contacts", updateEmergencyContacts);

export default router;
