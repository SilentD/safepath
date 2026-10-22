import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support Directory — One2Many" },
      { name: "description", content: "South African GBV hotlines, police, shelters, legal and counselling support in one place." },
      { property: "og:title", content: "Support Directory — One2Many" },
      { property: "og:description", content: "Verified GBV support services across South Africa." },
    ],
  }),
  component: Support,
});

const services = [
  { n: "GBV Command Centre", p: "0800 428 428", c: "Hotline", h: "24/7 · Free" },
  { n: "SAPS Emergency", p: "10111", c: "Police", h: "24/7" },
  { n: "Emergency (mobile)", p: "112", c: "Police", h: "24/7 · Free" },
  { n: "Lifeline SA", p: "0861 322 322", c: "Counselling", h: "24/7" },
  { n: "Childline", p: "116", c: "Counselling", h: "24/7 · Free" },
  { n: "Legal Aid SA", p: "0800 110 110", c: "Legal", h: "Weekdays" },
];
const cats = ["All", "Hotline", "Police", "Counselling", "Legal"];

function Support() {
  const [cat, setCat] = useState("All");
  const list = services.filter((s) => cat === "All" || s.c === cat);
  return (
    <AppShell eyebrow="You're not alone" title="Support">
      <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-2">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm ${c === cat ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>
            {c}
          </button>
        ))}
      </div>
      <ul className="mt-4 space-y-3">
        {list.map((s) => (
          <li key={s.n} className="flex items-center justify-between rounded-2xl border bg-card p-4">
            <div>
              <p className="font-medium">{s.n}</p>
              <p className="text-xs text-muted-foreground">{s.c} · {s.h}</p>
            </div>
            <a href={`tel:${s.p.replace(/\s/g, "")}`} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{s.p}</a>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
