import User from "../models/User.js";
import Session from "../models/Session.js";

export default class UserService {
  /**
   * Fetch user profile excluding password
   */
  static async getProfile(userId) {
    const user = await User.findById(userId).populate("emergencyContacts");
    if (!user) {
      throw new Error("User not found.");
    }
    return user;
  }

  static async addEmergencyContact(userId, newContact) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    // Ensure the emergencyContacts array exists on the document
    if (!user.emergencyContacts) {
      user.emergencyContacts = [];
    }

    // Append the new contact using standard array push
    user.emergencyContacts.push(newContact);

    // Save and return updated list
    await user.save();
    return user.emergencyContacts;
  }

  /**
   * Alternative: If you want a method that replaces the entire array
   */
  static async updateEmergencyContacts(userId, contacts) {
    // Ensure contacts is a clean array
    const contactList = Array.isArray(contacts) ? contacts : [];

    // Atomically find the user and update their emergency contacts
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { emergencyContacts: contactList } },
      { new: true, runValidators: true }, // { new: true } returns the updated document
    );

    if (!updatedUser) {
      throw new Error("User not found.");
    }

    return updatedUser.emergencyContacts;
  }
}
