import { api } from "@/lib/api-client";

export interface StartTimerPayload {
  durationMinutes: number;
  pin: string;
  gpsLocation?: { latitude: number; longitude: number } | null;
}

export const timerAPI = {
  start: (payload: StartTimerPayload) => {
    return api.post("/ping/start", payload);
  },
  checkIn: (timerId: string, payload?: { pin?: string; gpsLocation?: any }) => {
    return api.post(`/ping/${timerId}/checkIn`, payload);
  },
};