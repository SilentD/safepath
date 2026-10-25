import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { authAPI } from "../../services/auth";

export const Route = createFileRoute("/auth/verify")({
  head: () => ({
    meta: [
      { title: "Verify — One2Many Safety" },
      { name: "description", content: "Two-factor sign in for One2Many, South Africa's GBV safety and emergency response app." },
      { property: "og:title", content: "Verify — One2Many Safety" },
      { property: "og:description", content: "Secure two-factor sign in for One2Many." },
    ],
  }),
  component: Auth,
});

function Auth() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const nav = useNavigate();
  const full = code.every(Boolean);

  // Safe localStorage read with fallback
  const email = typeof window !== "undefined" ? localStorage.getItem("temp_email") || "your email" : "your email";

  const submit = async () => {
    try {
      const challengeId = localStorage.getItem("challenge");

      if (!challengeId) {
        alert("Session expired. Please log in again.");
        return;
      }

      // authAPI (fetch) returns the JSON payload directly
      const response = await authAPI.verify2FA({
        challengeId,
        code: code.join(""),
      });
      if (response.accessToken){ 
      localStorage.setItem("safepath_token", response.accessToken);    
      const userid = response.sessionUser?.id || response.sessionUser?._id;
      localStorage.setItem("userid", userid);
      
      localStorage.removeItem("challenge");
      localStorage.removeItem("temp_email");

      nav({ to: "/timer" });
    }
    } catch (e: any) {
      alert(e.message || "Invalid code");
    }
  };
  
  return (
    <AppShell eyebrow="Step 2 of 2" title="Confirm it's you">
      <p className="text-muted-foreground">
        Enter the 6-digit code sent to <span className="text-foreground">{email}</span>.
      </p>
      <div className="mt-8 grid grid-cols-6 gap-2">
        {code.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            inputMode="numeric"
            maxLength={1}
            value={d}
            aria-label={`Digit ${i + 1}`}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "");
              const n = [...code];
              n[i] = v;
              setCode(n);
              if (v && i < 5) refs.current[i + 1]?.focus();
            }}
            className="aspect-square rounded-xl border bg-input text-center font-display text-2xl outline-none focus:border-primary"
          />
        ))}
      </div>
      <button
        disabled={!full}
        onClick={submit}
        className="mt-8 w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground disabled:opacity-40"
      >
        Verify & continue
      </button>
      <button className="mt-3 w-full py-3 text-sm text-muted-foreground">Resend code in 0:28</button>
      <div className="mt-10 rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Discreet mode</p>
        Notifications show as "Calendar reminder" so no one else knows what this app is.
      </div>
    </AppShell>
  );
}