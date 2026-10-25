import { api } from "@/lib/api-client";

export interface StartTimerPayload {
  userId: string;
  durationMinutes: number;
  pin: string;
  gpsLocation?: { latitude: number; longitude: number } | null;
}

export const timerAPI = {
  start: (payload: StartTimerPayload) => {
    const token = localStorage.getItem("safepath_token") || "";
    
    // Combine payload properties and userId into a single request body object
    return api.post("/ping/start",payload);
  },
  
  checkIn: (timerId: string, payload?: { pin?: string; gpsLocation?: any }) => {
    return api.post(`/ping/${timerId}/checkIn`, payload);
  },
};