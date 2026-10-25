import { api } from "@/lib/api-client";

export interface RedModeTriggerPayload {
  gpsLocation?: { latitude: number; longitude: number } | null;
  note?: string;
}

export const safetyAPI = {
  triggerRedMode: async (payload?: RedModeTriggerPayload) => {
    return await api.post("/safety/red-mode/trigger", payload);
  },

  lockDiscreetSession: async () => {
    return await api.post("/safety/red-mode/lock");
  },
};