import User from "../models/User.js";
// Import your Timer and Support models if applicable

export const getAdminAnalytics = async (req, res, next) => {
  try {
    // Ensure admin role check
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Access denied. Admins only." });
    }
    let totalUsers;
    try {
      totalUsers = await User.countDocuments();
    } catch (error) {
      return res
        .status(403)
        .json({ success: false, message: "Database error." });
    }

    const activeTimersCount = 0; // Hook up to your Timer model count if desired
    const emergencyTriggersCount = 0; // Hook up to audit/alert logs count

    return res.status(200).json({
      success: true,
      analytics: {
        totalUsers,
        activeTimersCount,
        emergencyTriggersCount,
        systemStatus: "Operational",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error occured. refresh and try again.",
    });
  }
};
