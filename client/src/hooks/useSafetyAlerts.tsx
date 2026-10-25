import { useState, useEffect, useCallback } from "react";
import { alertAPI, SafetyAlert } from "@/services/alert";

export function useSafetyAlerts(pollIntervalMs: number = 10000) {
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [activeModalAlert, setActiveModalAlert] = useState<SafetyAlert | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    const token = localStorage.getItem("safepath_token");
    if (!token) return;

    try {
      setLoading(true);
      const data = await alertAPI.getActiveAlerts();
      if (Array.isArray(data)) {
        setAlerts(data);
        // Automatically pop up the modal for the most recent unacknowledged alert
        if (data.length > 0 && !activeModalAlert) {
          setActiveModalAlert(data[0]);
        }
      }
    } catch (err) {
      // Silently handle poll errors in background
    } finally {
      setLoading(false);
    }
  }, [activeModalAlert]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchAlerts, pollIntervalMs]);

  const dismissModal = () => setActiveModalAlert(null);

  return {
    alerts,
    unreadCount: alerts.length,
    activeModalAlert,
    dismissModal,
    refetch: fetchAlerts,
  };
}
