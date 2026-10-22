import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/vault")({
  head: () => ({
    meta: [
      { title: "Red Mode Vault — One2Many" },
      { name: "description", content: "One-press emergency alert with silent audio recording and an encrypted evidence vault." },
      { property: "og:title", content: "Red Mode Vault — One2Many" },
      { property: "og:description", content: "Instant alerts and encrypted evidence storage." },
    ],
  }),
  component: Vault,
});

const items = [
  { t: "Audio · 2m 14s", d: "12 Oct, 22:41", tag: "Auto" },
  { t: "Photo · 3 files", d: "09 Oct, 18:05", tag: "Manual" },
  { t: "Location trail", d: "09 Oct, 17:50", tag: "Auto" },
];

function Vault() {
  const [on, setOn] = useState(false);
  return (
    <AppShell eyebrow="Emergency" title={on ? "Red Mode active" : "Red Mode"} red={on}>
      <button onClick={() => setOn(!on)} aria-pressed={on}
        className={`mx-auto mt-4 grid aspect-square w-56 place-items-center rounded-full bg-danger text-danger-foreground glow-danger ${on ? "animate-pulse" : ""}`}>
        <span className="text-center">
          <span className="block font-display text-3xl font-bold">{on ? "STOP" : "HOLD"}</span>
          <span className="text-sm opacity-80">{on ? "Tap to end & verify" : "Tap to trigger"}</span>
        </span>
      </button>

      <div className="mt-8 grid grid-cols-3 gap-2 text-center text-xs">
        {[["Alert sent", on], ["Recording", on], ["SAPS notified", on]].map(([l, a]) => (
          <div key={l as string} className={`rounded-xl border p-3 ${a ? "border-danger text-foreground" : "bg-card text-muted-foreground"}`}>
            <span className={`mx-auto mb-1 block size-2 rounded-full ${a ? "bg-danger" : "bg-muted"}`} />{l as string}
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold">Evidence vault</h2>
      <p className="text-sm text-muted-foreground">Encrypted. Hidden from your gallery.</p>
      <ul className="mt-4 divide-y rounded-2xl border bg-card">
        {items.map((i) => (
          <li key={i.t} className="flex items-center justify-between p-4">
            <div><p className="font-medium">{i.t}</p><p className="text-xs text-muted-foreground">{i.d}</p></div>
            <span className="rounded-full bg-secondary px-2 py-1 text-xs text-muted-foreground">{i.tag}</span>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
