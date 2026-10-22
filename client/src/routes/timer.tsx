import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";

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
  useEffect(() => {
    if (left === null || left <= 0) return;
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  const total = mins * 60;
  const shown = left ?? total;
  const pct = left === null ? 1 : left / total;
  const mm = String(Math.floor(shown / 60)).padStart(2, "0");
  const ss = String(shown % 60).padStart(2, "0");
  const R = 110, C = 2 * Math.PI * R;
  const expired = left === 0;

  return (
    <AppShell eyebrow="Check-in" title="Safety Ping">
      <div className="relative mx-auto mt-4 grid aspect-square w-64 place-items-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 240 240">
          <circle cx="120" cy="120" r={R} fill="none" strokeWidth="10" className="stroke-muted" />
          <circle cx="120" cy="120" r={R} fill="none" strokeWidth="10" strokeLinecap="round"
            className={expired ? "stroke-danger" : "stroke-primary"} strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
            style={{ transition: "stroke-dashoffset 1s linear" }} />
        </svg>
        <div className="text-center">
          <p className="font-display text-5xl font-bold tabular-nums">{mm}:{ss}</p>
          <p className="mt-1 text-sm text-muted-foreground">{expired ? "Alerting your circle…" : left === null ? "Ready" : "Running in background"}</p>
        </div>
      </div>

      {left === null ? (
        <>
          <div className="mt-8 grid grid-cols-4 gap-2">
            {presets.map((p) => (
              <button key={p} onClick={() => setMins(p)}
                className={`rounded-xl border py-3 text-sm font-medium ${p === mins ? "border-primary bg-primary/10 text-primary" : "bg-card"}`}>
                {p}m
              </button>
            ))}
          </div>
          <button onClick={() => setLeft(total)} className="mt-6 w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground">Start timer</button>
        </>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3">
          <button onClick={() => setLeft(null)} className="rounded-xl bg-safe py-4 font-semibold text-primary-foreground">I'm safe</button>
          <button onClick={() => setLeft(left + 600)} className="rounded-xl border bg-card py-4 font-semibold">+10 min</button>
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
