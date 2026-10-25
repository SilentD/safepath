import { useState } from "react";
import { alert, SafetyAlert } from "@/services/alert";

interface SafetyAlertModalProps {
  alert: SafetyAlert | null;
  onClose: () => void;
}

export function SafetyAlertModal({ alert, onClose }: SafetyAlertModalProps) {
  const [responded, setResponded] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!alert) return null;

  const mapsLink = alert.location
    ? `https://maps.google.com/?q=${alert.location.latitude},${alert.location.longitude}`
    : null;

  const handleHelpOnTheWay = async () => {
    try {
      setLoading(true);
      await alert.respondToAlert(alert.id);
      setResponded(true);
    } catch (err: any) {
      alert(err.message || "Failed to send response");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-2xl">
        <div className="flex items-center space-x-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive text-2xl animate-pulse">
            🚨
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">
              Emergency Safety Alert
            </h3>
            <p className="text-xs text-muted-foreground">
              Timer expired for <span className="font-semibold text-foreground">{alert.userName || "Trusted Contact"}</span>
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-muted/50 p-4 text-sm space-y-2">
          <p className="font-medium text-foreground">Status: Needs immediate check-in</p>
          {mapsLink && (
            <a
              href={mapsLink}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary underline block hover:opacity-80"
            >
              View live GPS location on map →
            </a>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {responded ? (
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-center text-sm font-semibold text-green-600">
              ✓ Dispatched: "Help is on the way!"
            </div>
          ) : (
            <button
              disabled={loading}
              onClick={handleHelpOnTheWay}
              className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Notifying..." : "Respond: Help is on the way"}
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full rounded-xl border bg-card py-3 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}