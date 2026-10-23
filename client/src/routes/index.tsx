

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authAPI } from "../services/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "One2Many — Safety & Emergency Response" },
      { name: "description", content: "One2Many helps curb gender-based violence in South Africa with fast alerts, check-in timers and Red Mode." },
      { property: "og:title", content: "One2Many — You are never alone" },
      { property: "og:description", content: "Fast alerts, check-in timers, Red Mode and verified support across South Africa." },
    ],
  }),
  component: Home,
});

const features = [
  { to: "/timer", t: "Safety Ping", d: "A check-in timer that alerts your circle if you don't respond." },
  { to: "/vault", t: "Red Mode", d: "One tap sends your location and silently records evidence." },
  { to: "/support", t: "Support", d: "Verified hotlines, police and counselling — one tap to call." },
] as const;


function Home() {
  const nav = useNavigate();
  const [user, setUser] = useState<any>(null);

  
  return (
    <div className="brand-glow mx-auto flex min-h-screen max-w-md flex-col px-6 pt-14 pb-10">
      <p className="brand-wordmark text-center text-2xl font-bold tracking-[0.15em]">ONE 2 MANY</p>
      <div className="brand-gradient mx-auto mt-2 h-px w-24 opacity-70" />

      <h1 className="mt-12 text-4xl font-bold leading-tight">
        You are never <span className="brand-wordmark font-display">alone.</span>
      </h1>
      <p className="mt-3 text-muted-foreground">
        Fast, discreet protection against gender-based violence — one person connected to many who can help.
      </p>

      <Link to="/vault" className="brand-gradient mt-8 rounded-2xl py-4 text-center font-semibold text-primary-foreground shadow-lg">
        Open Red Mode
      </Link>
      <Link to="/auth/login" className="mt-3 rounded-2xl border bg-card py-4 text-center font-medium">
        Sign in securely
      </Link>

      <div className="mt-10 space-y-3">
        {features.map((f) => (
          <Link key={f.to} to={f.to} className="flex items-start gap-4 rounded-2xl border bg-card/70 p-4">
            <span className="brand-gradient mt-1 size-3 shrink-0 rounded-full" />
            <span>
              <span className="block font-display font-semibold">{f.t}</span>
              <span className="text-sm text-muted-foreground">{f.d}</span>
            </span>
          </Link>
        ))}
      </div>

      <a href="tel:0800428428" className="mt-auto pt-10 text-center text-sm text-muted-foreground">
        GBV Command Centre · <span className="text-primary">0800 428 428</span> · 24/7
      </a>
    </div>
  );
}