import nodemailer from "nodemailer";

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
