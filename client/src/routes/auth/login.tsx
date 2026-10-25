import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "../../components/AppShell";
import { authAPI } from "../../services/auth";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [
      { title: "Sign in — One2Many Safety" },
      { name: "description", content: "Sign in to One2Many, South Africa's GBV safety and emergency response app." },
    ],
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await authAPI.login(form);
      localStorage.setItem("temp-email", form.email);
     
      if (data.challengeId) {
        localStorage.setItem("challenge", data.challengeId);
        nav({ to: "/auth/verify" });
      }else if(data.sessionUser) {
        const token = data.accessToken || data.token;
        const expiresIn = data.expiresIn || "50m";
        const userid = data.sessionUser?.id;
        localStorage.setItem("userid", userid);
      
        if (token) {
          localStorage.setItem("safepath_token", token);
        }
        nav({ to: "/timer" });
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell eyebrow="Welcome back" title="Sign in to SafePath">
      <p className="text-muted-foreground text-sm">Your safety companion, secured end-to-end.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <input
          className="w-full h-12 rounded-xl border bg-input px-4 outline-none focus:border-primary text-sm"
          type="email"
          placeholder="you@email.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          className="w-full h-12 rounded-xl border bg-input px-4 outline-none focus:border-primary text-sm"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        {error && (
          <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">{error}</p>
        )}

        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground disabled:opacity-40"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <Link to="/auth/register" className="text-foreground font-medium">Create account</Link>
        <span className="text-muted-foreground mx-2">•</span>
        <Link to="/auth/forgot-password" className="text-muted-foreground">Forgot password?</Link>
      </div>
    </AppShell>
  );
}