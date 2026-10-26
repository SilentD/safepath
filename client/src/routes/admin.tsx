import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { adminAPI, AdminAnalytics } from "@/services/admin";

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminAPI.getAnalytics()
      .then((res) => {
        if (res.success) {
          setAnalytics(res.analytics);
        }
      })
      .catch((err) => {
        setError(err.message || "Unauthorized or failed to load analytics.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell eyebrow="Management" title="Admin Dashboard">
      <div className="space-y-6 pt-4">
        {error && (
          <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-center text-sm font-semibold text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Loading analytics...</div>
        ) : analytics ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl border bg-card p-5 space-y-2 shadow-sm">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Total Users</span>
              <p className="text-3xl font-black">{analytics.totalUsers}</p>
            </div>
            <div className="rounded-3xl border bg-card p-5 space-y-2 shadow-sm">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Active Users</span>
              <p className="text-3xl font-black text-green-500">{analytics.activeUsersCount}</p>
            </div>
            <div className="col-span-2 rounded-3xl border bg-card p-5 space-y-2 shadow-sm flex justify-between items-center">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold">System Health</span>
                <p className="text-lg font-bold">{analytics.systemHealth}</p>
              </div>
              <span className="flex h-3 w-3 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}