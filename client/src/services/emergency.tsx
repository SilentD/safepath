import { api } from "@/lib/api-client";

export interface RedModeTriggerPayload {
  gpsLocation?: { latitude: number; longitude: number } | null;
  note?: string;
}

export const safetyAPI = {
  triggerRedMode: async (payload?: RedModeTriggerPayload) => {
    return await api.post("/vault/red-mode/trigger", payload);
  },

  lockDiscreetSession: async () => {
    return await api.post("/vault/red-mode/lock");
  },

  
  async uploadEvidence(audioBlob: Blob, location?: { lat: number; lng: number } | null) {
    const formData = new FormData();
    
    // 1. Append the audio file (matches upload.single("file") on backend)
    formData.append("file", audioBlob, `red-mode-recording-${Date.now()}.webm`);

    // 2. Append geolocation coordinates if available
    if (location) {
      formData.append("locationLat", location.lat.toString());
      formData.append("locationLng", location.lng.toString());
    }

    // 3. Post to vault upload endpoint
    // Note: Ensure your API client allows multipart/form-data headers automatically
    const response = await api.post("/vault/upload", formData);

    return response.data;
  },
}

