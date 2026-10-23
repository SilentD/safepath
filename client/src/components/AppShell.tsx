import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { api } from "../lib/api";

const tabs = [
  { to: "/", label: "Home" },
  { to: "/timer", label: "Ping" },
  { to: "/vault", label: "Red Mode" },
  { to: "/support", label: "Support" },
] as const;

  

export function AppShell({ title, eyebrow, children, red }: { title: string; eyebrow: string; children: ReactNode; red?: boolean }) {
 
  return (
    <div className={`mx-auto flex min-h-screen max-w-md flex-col ${red ? "red-mode" : ""}`}>
      <header className="px-6 pt-8 pb-4">
        <p className="text-xs uppercase tracking-[0.2em]"><span className="brand-wordmark font-bold">ONE 2 MANY</span> <span className="text-muted-foreground">· {eyebrow}</span></p>
        <h1 className="mt-1 text-3xl font-bold">{title}</h1>
      </header>
      <main className="flex-1 px-6 pb-28">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 mx-auto grid max-w-md grid-cols-4 border-t bg-card/95 backdrop-blur">
        {tabs.map((t) => (
          <Link key={t.to} to={t.to} activeOptions={{ exact: true }}
            className="py-4 text-center text-xs font-medium text-muted-foreground"
            activeProps={{ className: "text-primary" }}>
            {t.label}
          </Link>
        ))}
        <button >logout</button>
      </nav>
    </div>
  );
}
