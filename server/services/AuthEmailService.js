import nodemailer from "nodemailer";

export default class AuthEmailService {
  static transporter;
  static getTransporter() {
    if (this.transporter) return this.transporter;

    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_SECURE,
      SMTP_USER,
      SMTP_PASS,
      SMTP_FROM,
    } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
      throw new Error("Authentication email is not configured.");
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    return transporter;
  }

  static async sendCode({ to, code, purpose }) {
    const subjects = {
      signup: "Verify your SafePath email",
      login: "Your SafePath sign-in verification code",
      password_reset: "Reset your SafePath password",
    };

    const subject = subjects[purpose];

    if (!subject) {
      throw new Error("Unsupported authentication email purpose.");
    }

    await this.getTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text: [
        `Your SafePath verification code is: ${code}`,
        "",
        "This code expires in 10 minutes and can only be used once.",
        "If you did not request this code, you can ignore this email.",
      ].join("\n"),
    });
  }

  static async sendWarning({ url, fullnames, geoLocation, contacts: [] }) {
    for (contact in contacts) {
      await this.getTransporter().sendMail({
        from: process.env.SMTP_FROM,
        contact,
        subject: "SafePath Emergency Alert",
        text: [
          "Urgent Attention required please assist: ${fullnames}",
          "",
          `visit: ${url} to assist at ${geoLocation}`,
          "",
          "If you did not request this, ignore this email.",
        ].join("\n"),
      });
    }
  }

  static async sendPasswordReset({ to, resetUrl }) {
    await this.getTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: "Reset your SafePath password",
      text: [
        "A password reset was requested for your SafePath account.",
        "",
        `Use this link to reset your password: ${resetUrl}`,
        "",
        "If you did not request this, ignore this email.",
      ].join("\n"),
    });
  }
}
