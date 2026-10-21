import Timer from "../models/Timer.js";
import User from "../models/User.js";
import NotificationService from "./NotificationService.js";

export default class BackgroundWorker {
  constructor(intervalMs = 5000) {
    this.intervalMs = intervalMs;
    this.interval = null;
    this.running = false;
    this.stopping = false;
  }

  async runOnce() {
    const expiredCount = await Timer.expireDueTimers(100);

    if (expiredCount > 0) {
      console.log(`Safety Ping: ${expiredCount} timer(s) expired.`);
    }

    const pending = await Timer.findPendingNotifications(100);

    for (const timer of pending) {
      const claimed = await Timer.beginNotificationAttempt(timer._id);

      if (!claimed) continue;

      try {
        const user = await User.findById(claimed.userId);

        if (!user) {
          throw new Error("Timer owner was not found.");
        }

        const result = await NotificationService.sendTimeoutAlert(
          claimed,
          user,
        );

        await Timer.markNotificationResult(
          claimed._id,
          result.mode === "sent" ? "sent" : "mocked",
        );

        console.log(`Safety Ping notification processed: ${result.mode}.`);
      } catch (error) {
        const attempts = claimed.notificationAttempts || 1;
        const nextStatus = attempts >= 5 ? "failed" : "pending";

        await Timer.markNotificationResult(
          claimed._id,
          nextStatus,
          error.message,
        );

        console.error(
          `Safety Ping notification error (${nextStatus}):`,
          error.message,
        );
      }
    }

    return expiredCount;
  }

  async tick() {
    if (this.running || this.stopping) return;

    this.running = true;

    try {
      await this.runOnce();
    } catch (error) {
      console.error("Background worker error:", error.message);
    } finally {
      this.running = false;
    }
  }

  start() {
    if (this.interval) return;

    this.stopping = false;
    void this.tick();

    this.interval = setInterval(() => {
      void this.tick();
    }, this.intervalMs);

    console.log(`Background worker started (interval: ${this.intervalMs}ms).`);
  }

  async stop() {
    this.stopping = true;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    while (this.running) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    console.log("Background worker stopped.");
  }
}
