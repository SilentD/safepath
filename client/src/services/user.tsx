import { api } from "@/lib/api-client";

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship?: string;
}

export const userAPI = {
  // Fetch user profile & contacts
  getProfile: async () => {
    return await api.get("/user/profile");
  },

  // Update trusted emergency contacts list
  updateContacts: async (contacts: EmergencyContact[]) => {
    return await api.put("/user/contacts", { contacts });
  },
};