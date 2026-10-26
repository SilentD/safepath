import { api } from "@/lib/api-client";

export interface AdminAnalytics {
  totalUsers: number;
  activeUsersCount: number;
  systemHealth: string;
  timestamp: string;
}

export const adminAPI = {
  // Fetch system impact and performance analytics
  getAnalytics: async (): Promise<{ success: boolean; analytics: AdminAnalytics }> => {
    return await api.get("/admin/analytics");
  },
};