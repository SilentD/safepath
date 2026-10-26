import User from "../models/User.js";

export default class AdminService {
  /**
   * Aggregate high-level platform impact and performance analytics
   */
  static async getAnalytics() {
    const totalUsers = await User.countDocuments({});
    const activeUsersCount = await User.countDocuments({ active: true });

    // You can extend this with Timer or Alert collections when ready
    return {
      totalUsers,
      activeUsersCount,
      systemHealth: "Optimal",
      timestamp: new Date().toISOString(),
    };
  }
}
