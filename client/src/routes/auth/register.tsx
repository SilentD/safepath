import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "../../components/AppShell";
import { authAPI } from "../../services/auth";

export const Route = createFileRoute("/auth/register")({
  head: () => ({ meta: [{ title: "Create account — One2Many Safety" }] }),
  component: Register,
});

function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await authAPI.register(form);
      localStorage.setItem("temp_email", form.email);
      nav({ to: "/auth/verify-email" });
    } finally { setLoading(false); }
  };

  return (
    <AppShell eyebrow="Join SafePath" title="Create your account">
      <p className="text-muted-foreground text-sm">Takes 30 seconds. Your data stays private.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <input className="w-full h-12 rounded-xl border bg-input px-4 outline-none focus:border-primary text-sm" placeholder="Full name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
        <input className="w-full h-12 rounded-xl border bg-input px-4 outline-none focus:border-primary text-sm" type="email" placeholder="you@email.com" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
        <input className="w-full h-12 rounded-xl border bg-input px-4 outline-none focus:border-primary text-sm" type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
        <button disabled={loading} className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground disabled:opacity-40">
          Create account
        </button>
      </form>
      <div className="mt-6 text-center text-sm text-muted-foreground">
        Already have account? <Link to="/auth/login" className="text-foreground font-medium">Sign in</Link>
      </div>
    </AppShell>
  );
}