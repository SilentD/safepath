import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell.tsx";
import { timerAPI } from "../services/timer";

export const Route = createFileRoute("/timer")({
  head: () => ({
    meta: [
      { title: "Safety Ping Timer — One2Many" },
      { name: "description", content: "Set a check-in timer. If you don't respond, your trusted contacts are alerted with your location." },
      { property: "og:title", content: "Safety Ping Timer — One2Many" },
      { property: "og:description", content: "A background check-in timer that alerts your circle." },
    ],
  }),
  component: Timer,
});

const presets = [5, 15, 30, 60];

function Timer() {
  const [mins, setMins] = useState(15);
  const [left, setLeft] = useState<number | null>(null);
  const [pin, setPin] = useState("");
  const [auth, setAuth] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (left === null || left <= 0) return;
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  

  // Helper to fetch GPS location
  const getGPS = (): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 8000 }
      );
    });
  };
  let total=0;
  const shown = left ?? total;
  const pct = left === null ? 1 : left / total;
  const mm = String(Math.floor(shown / 60)).padStart(2, "0");
  const ss = String(shown % 60).padStart(2, "0");
  const R = 110, C = 2 * Math.PI * R;
  const expired = left === 0;
  
  const startTimer = async () => {
  setLoading(true);
  setError("");
  

  try {
    const userId = localStorage.getItem("userid");
    if (!userId) {
      throw new Error("User session not found. Please log in again.");
    }

    const gpsLocation = await getGPS();

    const data = await timerAPI.start({
      userId,
      durationMinutes: mins,
      pin,
      gpsLocation,
    });

    total = data.durationSeconds;
    localStorage.setItem("user",data.userId);
    localStorage.setItem("pinHash",data.pinHash);
    localStorage.setItem("timerId",data._id);
    localStorage.setItem("locationLat",data.locationLat);
    localStorage.setItem("locationLon",data.locationLng);
    
    
    setLeft(total);
  } catch (err: any) {
    setError(err.message || "Failed to start timer");
  } finally {
    setLoading(false);
  }
};
  
  const invalidateTimer = async () =>{
    setLoading(true);
    setError("");

    try {
      const locationLat = localStorage.getItem("locationLat");
      const locationLng = localStorage.getItem("locationLon");
      const timerId = localStorage.getItem("timerId");
      const location = {lat:locationLat,lon:locationLng}
      timerAPI.checkIn({timerId,auth,location});
      setLeft(null);
      localStorage.removeItem("pinHash");
      localStorage.removeItem("timerId");
      localStorage.removeItem("locationLat");
      localStorage.removeItem("locationLon");
    
    } catch (error) {
      setError("Invalid data entry.");
    }finally{
      setLoading(false);
    }
  
  };
  return (
    <AppShell eyebrow="Check-in" title="Safety Ping">
      <div className="relative mx-auto mt-4 grid aspect-square w-64 place-items-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 240 240">
          <circle cx="120" cy="120" r={R} fill="none" strokeWidth="10" className="stroke-muted" />
          <circle
            cx="120"
            cy="120"
            r={R}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className={expired ? "stroke-danger" : "stroke-primary"}
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="text-center">
          <p className="font-display text-5xl font-bold tabular-nums">{mm}:{ss}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {expired ? "Alerting your circle…" : left === null ? "Ready" : "Running in background"}
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-500 bg-red-50 p-3 rounded-xl text-center">{error}</p>
      )}

      {left === null ? (
        <>
          <div className="mt-8 grid grid-cols-4 gap-2">
            {presets.main ? null : presets.map((p) => (
              <button
                key={p}
                onClick={() => setMins(p)}
                className={`rounded-xl border py-3 text-sm font-medium ${
                  p === mins ? "border-primary bg-primary/10 text-primary" : "bg-card"
                }`}
              >
                {p}m
              </button>
            ))}
          </div>

          <input
            className="mt-4 w-full h-12 rounded-xl border bg-input px-4 outline-none focus:border-primary text-sm"
            type="password"
            placeholder="Safety PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
          />

          <button
            disabled={loading || !pin}
            onClick={startTimer}
            className="mt-6 w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground disabled:opacity-40"
          >
            {loading ? "Starting timer..." : "Start timer"}
          </button>
        </>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3">
          <button onClick={invalidateTimer} className="rounded-xl bg-green-600 py-4 font-semibold text-white">
            I'm safe
          </button>
          <input
            className="mt-4 w-full h-12 rounded-xl border bg-input px-4 outline-none focus:border-primary text-sm"
            type="password"
            placeholder="Re-enter Safety PIN"
            value={auth}
            onChange={(e) => setAuth(e.target.value)}
            required
          />
          
        </div>
      )}

      <div className="mt-8 rounded-2xl border bg-card p-4">
        <p className="text-sm font-medium">If the timer ends, we'll send:</p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>• Your live location to 3 trusted contacts</li>
          <li>• A low-data SMS backup if you're offline</li>
        </ul>
      </div>
    </AppShell>
  );
}