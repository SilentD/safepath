import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { authAPI } from "../../services/auth";

export const Route = createFileRoute("/auth/verifyEmail")({
  head: () => ({ meta: [{ title: "Verify email — One2Many Safety" }] }),
  component: VerifyEmail,
});

function VerifyEmail() {
  const [code, setCode] = useState(["","","","","",""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const nav = useNavigate();
  const full = code.every(Boolean);
  const email = localStorage.getItem("temp_email") || "";

  const submit = async () => {
    try {
     const challengeId= localStorage.getItem("challenge");
      const { data } = await authAPI.verifyEmail({ challengeId, code: code.join("") });
      localStorage.setItem("safepath_token", data.accessToken);
      nav({ to: "/auth/login" });
    } catch (e: any) { alert(e.response?.data?.message || "Invalid code"); }
    localStorage.removeItem('challenge')
  };

  return (
    <AppShell eyebrow="Step 1 of 2" title="Verify your email">
      <p className="text-muted-foreground">Enter code sent to <span className="text-foreground">{email || "your email"}</span>.</p>
      <div className="mt-8 grid grid-cols-6 gap-2">
        {code.map((d,i) => (
          <input key={i} ref={el=>{refs.current[i]=el}} inputMode="numeric" maxLength={1} value={d}
            onChange={e=>{
              const v=e.target.value.replace(/\D/g,""); const n=[...code]; n[i]=v; setCode(n);
              if(v && i<5) refs.current[i+1]?.focus();
            }}
            className="aspect-square rounded-xl border bg-input text-center font-display text-2xl outline-none focus:border-primary" />
        ))}
      </div>
      <button disabled={!full} onClick={submit} className="mt-8 w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground disabled:opacity-40">Verify & continue</button>
      
    </AppShell>
  );
}