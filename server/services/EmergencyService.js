import twilio from "twilio";
import User from "../models/User.js";
import Timer from "../models/Timer.js";

// Initialize Twilio client using environment variables
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

export default class AlertService {
  /**
   * Triggers emergency alerts to trusted contacts via Twilio SMS
   */
  static async triggerEmergencyAlert(userId, timerData = {}) {
    try {
      // 1. Fetch user and their emergency contacts
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found for alert dispatch.");
      }

      const contacts = user.emergencyContacts || [];
      if (contacts.length === 0) {
        console.warn(`[Alert] No emergency contacts found for user ${userId}`);
        return {
          success: false,
          message: "No emergency contacts registered.",
          notifiedCount: 0,
        };
      }

      // 2. Format location Google Maps link if GPS coordinates exist
      const { locationLat, locationLon } = timerData.location || {};
      const mapsLink =
        latitude && longitude
          ? `https://maps.google.com/?q=${locationLat},${locationLon}`
          : "Location coordinates unavailable.";

      // 3. Compose emergency message based on trigger type
      const triggerLabel =
        timerData.triggerType === "RED_MODE_PANIC"
          ? "RED MODE PANIC SOS"
          : "EMERGENCY SAFETY ALERT";
      const messageBody = `${triggerLabel}: ${user.name || "A user"} requires immediate assistance (${timerData.note || "Timer expired or panic button engaged"}). Live location: ${mapsLink}`;

      // 4. Send SMS to all emergency contacts in parallel
      const smsPromises = contacts.map(async (contact) => {
        if (!contact.phone) return null;

        try {
          return await twilioClient.messages.create({
            body: messageBody,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: contact.phone,
          });
        } catch (smsError) {
          console.error(
            `Failed to send SMS to ${contact.phone}:`,
            smsError.message,
          );
          return null;
        }
      });

      const results = await Promise.all(smsPromises);
      const successfulSends = results.filter((res) => res !== null).length;

      console.log(
        `[Alert] Emergency broadcast completed for user ${userId}. Notified: ${successfulSends}/${contacts.length}`,
      );

      return {
        success: true,
        alertId: `alert_${Date.now()}_${userId}`,
        notifiedCount: successfulSends,
      };
    } catch (error) {
      console.error("[AlertService Error]:", error.message);
      throw error;
    }
  }

  /**
   * Handles a trusted contact responding "Help is on the way" to an active alert
   */
  static async handleAlertResponse(alertId, responderUserId) {
    try {
      // Find the active timer/alert by ID
      const timer = await Timer.findById(alertId);
      if (!timer) {
        throw new Error("Active alert or timer not found.");
      }

      // Update timer state to indicate help has been dispatched
      timer.status = "HELP_ON_THE_WAY";
      timer.responderId = responderUserId;
      timer.respondedAt = new Date();
      await timer.save();

      console.log(
        `[Alert] Responder ${responderUserId} acknowledged alert ${alertId}. Notified endangered user.`,
      );

      return {
        success: true,
        message: "Response registered successfully.",
        timerId: timer._id,
        status: timer.status,
        responderId: responderUserId,
      };
    } catch (error) {
      console.error("[AlertService Response Error]:", error.message);
      throw error;
    }
  }
}
