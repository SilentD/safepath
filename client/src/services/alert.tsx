import { api } from "@/lib/api-client";

export interface SafetyAlert {
  id: string;
  userId: string;
  userName: string;
  status: string;
  location?: { latitude: number; longitude: number };
  createdAt: string;
}

export const alertAPI = {
  // Fetch active alerts for users in your trusted circle / responders
  getActiveAlerts: async (): Promise<SafetyAlert[]> => {
    return await api.get("/ping/alerts/active");
  },

  // Send "Help is on the way" acknowledgment
  respondToAlert: async (alertId: string) => {
    return await api.post(`/ping/alerts/${alertId}/respond`, {
      message: "Help is on the way",
    });
  },
};