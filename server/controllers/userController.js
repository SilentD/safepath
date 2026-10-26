import UserService from "../services/UserService.js";

export const getUserProfile = async (req, res, next) => {
  try {
    const user = await UserService.getProfile(req.user.id);
    return res.status(200).json({ success: true, user });
  } catch (error) {
    next("Emergency Contact not updated. Try again later.");
  }
};

export const updateEmergencyContacts = async (req, res, next) => {
  try {
    const { contacts } = req.body;
    const userId = req.user?.id || req.user?._id || req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user ID.",
      });
    }

    // Await service call and assign to outer scope variable
    const emergencyContacts = await UserService.updateEmergencyContacts(
      userId,
      contacts,
    );

    return res.status(200).json({
      success: true,
      message: "Emergency contacts updated successfully.",
      emergencyContacts,
    });
  } catch (error) {
    console.error("[Update Contacts Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: "Emergency Contact not updated. Try again later.",
      error: error.message,
    });
  }
};
