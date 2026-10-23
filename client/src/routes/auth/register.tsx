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
  const [form, setForm] = useState({ name: "", phoneNumber: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
    const data=  await authAPI.register(form);
      localStorage.setItem("challenge",data.challengeId);
      localStorage.setItem("temp_email", form.email);
      nav({ to: "/auth/verifyEmail" });
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell eyebrow="Join SafePath" title="Create your account">
      <p className="text-muted-foreground text-sm">Takes 30 seconds. Your data stays private.</p>
      
      <form onSubmit={submit} className="mt-8 space-y-4">
        <input 
          className="w-full h-12 rounded-xl border bg-input px-4 outline-none focus:border-primary text-sm" 
          placeholder="Fullnames" 
          value={form.fullName} 
          onChange={e => setForm({ ...form, fullName: e.target.value })} 
          
        />
        <input 
          className="w-full h-12 rounded-xl border bg-input px-4 outline-none focus:border-primary text-sm" 
          placeholder="Phone number (e.g., 27725779455)" 
          value={form.phoneNumber} 
          onChange={e => setForm({ ...form, phoneNumber: e.target.value })} 
          
        />
        <input 
          className="w-full h-12 rounded-xl border bg-input px-4 outline-none focus:border-primary text-sm" 
          type="email" 
          placeholder="you@email.com" 
          value={form.email} 
          onChange={e => setForm({ ...form, email: e.target.value })} 
          
        />
        <input 
          className="w-full h-12 rounded-xl border bg-input px-4 outline-none focus:border-primary text-sm" 
          type="password" 
          placeholder="Password" 
          value={form.password} 
          onChange={e => setForm({ ...form, password: e.target.value })} 
          
        />

        {error && (
          <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">{error}</p>
        )}

        <button 
          disabled={loading} 
          type="submit" 
          className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground disabled:opacity-40"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/auth/login" className="text-foreground font-medium">Sign in</Link>
      </div>
    </AppShell>
  );
}