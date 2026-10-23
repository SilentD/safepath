import { createFileRoute,useNavigate,Link } from '@tanstack/react-router'
import { useState } from "react";
import { AppShell } from "../../components/AppShell";
import { authAPI } from "../../services/auth";

export const Route = createFileRoute('/auth/forgot-password')({
  head: () => ({
    meta: [
      { title: "Forgot password — One2Many Safety" },
      { name: "description", content: "Forgot Password in One2Many, South Africa's GBV safety and emergency response app." },
    ],
  }),
  component: forgotPassword,
})

function forgotPassword() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: ''});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await authAPI.forgotPassword(form);
      
      if (data.message) {
        
        nav({ to: "/auth/login" });
      }
      
    } catch (err: any) {
      setError(err.message || "unknown error 1");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell eyebrow="Welcome back" title="Sign in to SafePath">
      <p className="text-muted-foreground text-sm">Your safety companion, secure password.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <input
          className="w-full h-12 rounded-xl border bg-input px-4 outline-none focus:border-primary text-sm"
          type="email"
          placeholder="you@email.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
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
          {loading ? "Requesting reset code..." : "Send code"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <Link to="/auth/register" className="text-foreground font-medium">Create account</Link>
        <span className="text-muted-foreground mx-2">•</span>
        <Link to="/auth/reset-password" className="text-muted-foreground">Reset password?</Link>
      </div>
    </AppShell>
  );
}