import nodemailer from "nodemailer";
import twilio from "twilio";
import User from "../models/User.js";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);
export default class NotificationService {
  static transporter;

  static isConfigured() {
    return Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM,
    );
  }

  static getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    return this.transporter;
  }

  /**
   * Triggers emergency alerts to trusted contacts via Twilio SMS
   */
  static async triggerEmergencyAlert(userId, timerData) {
    try {
      // 1. Fetch user and their emergency contacts
      const user = await User.findById(userId).populate("emergencyContacts");
      if (!user) throw new Error("User not found for alert dispatch.");

      const contacts = user.emergencyContacts || [];
      if (contacts.length === 0) {
        console.warn(`[Alert] No emergency contacts found for user ${userId}`);
        return { success: false, message: "No emergency contacts registered." };
      }

      // 2. Format location Google Maps link if GPS coordinates exist
      const { latitude, longitude } = timerData.location || {};
      const mapsLink =
        latitude && longitude
          ? `https://maps.google.com/?q=${latitude},${longitude}`
          : "Location coordinates unavailable.";

      // 3. Compose emergency message
      const messageBody = `EMERGENCY ALERT: ${user.name || "A user"} has failed to check in on One2Many Safety. Live location: ${mapsLink}`;

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

      await Promise.all(smsPromises);
      console.log(`[Alert] Emergency broadcast completed for user ${userId}`);

      return { success: true, notifiedCount: contacts.length };
    } catch (error) {
      console.error("[AlertService Error]:", error.message);
      throw error;
    }
  }

  static getLocationUrl(latitude, longitude) {
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return null;
    }

    return `https://maps.google.com/?q=${latitude},${longitude}`;
  }

  static getRecipients(user) {
    const contactEmails = Array.isArray(user?.emergencyContacts)
      ? user.emergencyContacts
          .map((contact) => contact?.email)
          .filter((email) => typeof email === "string" && email.trim())
      : [];

    const fallbackEmails = (process.env.ALERT_EMAIL_TO || "")
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);

    return [...new Set([...contactEmails, ...fallbackEmails])];
  }

  static async dispatch({ subject, text, recipients }) {
    if (!this.isConfigured() || recipients.length === 0) {
      console.warn("[SafePath MOCK EMAIL]", {
        subject,
        recipientCount: recipients.length,
        reason: !this.isConfigured()
          ? "SMTP is not configured"
          : "No alert recipients configured",
      });

      return { mode: "mock" };
    }

    const result = await this.getTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to: recipients,
      subject,
      text,
    });

    return {
      mode: "sent",
      messageId: result.messageId,
    };
  }

  static async sendTimeoutAlert(timer, user) {
    const recipients = this.getRecipients(user);
    const locationUrl = this.getLocationUrl(
      timer.locationLat,
      timer.locationLng,
    );

    const text = [
      "SAFEPATH SAFETY ALERT",
      "",
      "A Safety Ping timer has expired without a successful check-in.",
      `Registered phone: ${user?.phoneNumber || "Not available"}`,
      `Timer ID: ${String(timer._id)}`,
      `Expired at: ${(timer.expiresAt || new Date()).toISOString()}`,
      `Location: ${locationUrl || "Location unavailable"}`,
    ].join("\n");

    return this.dispatch({
      subject: "SafePath: Missed Safety Check-in",
      text,
      recipients,
    });
  }

  static async sendSOS({ user, location, reason }) {
    const recipients = this.getRecipients(user);
    const locationUrl = this.getLocationUrl(
      location?.latitude,
      location?.longitude,
    );

    const text = [
      "SAFEPATH EMERGENCY SOS",
      "",
      "A user has triggered a manual SOS alert.",
      `Registered phone: ${user?.phoneNumber || "Not available"}`,
      `Reason: ${reason || "No reason provided"}`,
      `Location: ${locationUrl || "Location unavailable"}`,
      `Triggered at: ${new Date().toISOString()}`,
    ].join("\n");

    return this.dispatch({
      subject: "SafePath: Emergency SOS",
      text,
      recipients,
    });
  }
}
