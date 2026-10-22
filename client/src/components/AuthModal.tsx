import { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from '@tanstack/react-router';
import { authAPI, AuthPayload } from '../services/auth';

export type AuthMode = 'signin' | 'register' | 'verifyEmail' | 'verifyOtp' | 'forgot' | 'login';

const MODE_MAP: Record<string, AuthMode> = {
  'login': 'signin',
  'signin': 'signin',
  'register': 'register',
  'verify-email': 'verifyEmail',
  'verify-otp': 'verifyOtp',
  'verify-2fa': 'verifyOtp',
  'forgot-password': 'forgot',
};

const MODES: Record<AuthMode, { title: string; subtitle: string }> = {
  signin: { title: 'Welcome back', subtitle: 'Sign in to your SafePath account' },
  login: { title: 'Welcome back', subtitle: 'Sign in to your SafePath account' },
  register: { title: 'Create account', subtitle: 'Join SafePath in 30 seconds' },
  verifyEmail: { title: 'Verify your email', subtitle: 'We sent a code to your email' },
  verifyOtp: { title: 'Enter OTP', subtitle: '6-digit code from your email' },
  forgot: { title: 'Reset password', subtitle: "We'll send you reset instructions" },
};

interface Props {
  onSuccess?: () => void;
}

export default function AuthModal({ onSuccess }: Props) {
  const navigate = useNavigate();
  const { mode: routeMode } = useParams<{ mode: string }>();
  
  const resolvedMode: AuthMode = MODE_MAP[routeMode || 'signin'] || 'signin';
  const [mode, setMode] = useState<AuthMode>(resolvedMode);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<AuthPayload>({ name: '', email: '', password: '', code: '' });
  const [error, setError] = useState('');

  const current = MODES[mode];

  const changeMode = (newMode: AuthMode) => {
    const route = Object.keys(MODE_MAP).find(k => MODE_MAP[k] === newMode) || newMode;
    if (newMode === 'signin') navigate('/login');
    else if (newMode === 'register') navigate('/register');
    else if (newMode === 'verifyEmail') navigate('/verify-email');
    else if (newMode === 'verifyOtp') navigate('/verify-otp');
    else if (newMode === 'forgot') navigate('/forgot-password');
    setMode(newMode);
  };

  const handleClose = () => navigate('/');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (mode === 'register') {
        await authAPI.register(form);
        changeMode('verifyEmail');
      } else if (mode === 'signin' || mode === 'login') {
        const { data } = await authAPI.login({ email: form.email, password: form.password });
        if (data.need2FA || data.requires2FA) {
          localStorage.setItem('temp_email', form.email || '');
          changeMode('verifyOtp');
        } else {
          localStorage.setItem('safepath_token', data.accessToken || data.token);
          onSuccess?.(); navigate('/');
        }
      } else if (mode === 'verifyEmail') {
        const { data } = await authAPI.verifyEmail({ email: form.email, code: form.code });
        localStorage.setItem('safepath_token', data.accessToken);
        onSuccess?.(); navigate('/');
      } else if (mode === 'verifyOtp') {
        const email = localStorage.getItem('temp_email') || form.email;
        const { data } = await authAPI.verify2FA({ email, code: form.code });
        localStorage.setItem('safepath_token', data.accessToken);
        localStorage.removeItem('temp_email');
        onSuccess?.(); navigate('/');
      } else if (mode === 'forgot') {
        await authAPI.forgotPassword({ email: form.email });
        alert('Reset link sent'); changeMode('signin');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const resend = async () => {
    try {
      if (mode === 'verifyOtp') await authAPI.resend2FA({ email: localStorage.getItem('temp_email') || form.email });
      else await authAPI.resendVerification({ email: form.email });
      alert('Code resent');
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} className="w-full max-w-[420px] bg-white rounded-[24px] p-8 shadow-2xl relative">
        <button onClick={handleClose} className="absolute right-5 top-5 p-2 rounded-full hover:bg-slate-100"><X size={18} /></button>
        <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center font-bold text-xl mb-6">S</div>
        <h2 className="text-[24px] font-bold tracking-tight">{current.title}</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">{current.subtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="relative"><User className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 focus:border-black outline-none text-sm" placeholder="Full name" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} /></div>
          )}
          {(mode === 'signin' || mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <div className="relative"><Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 focus:border-black outline-none text-sm" type="email" placeholder="you@email.com" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required /></div>
          )}
          {(mode === 'signin' || mode === 'login' || mode === 'register') && (
            <div className="relative"><Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 focus:border-black outline-none text-sm" type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required /></div>
          )}
          {(mode === 'verifyEmail' || mode === 'verifyOtp') && (
            <input className="w-full h-[56px] text-center text-[28px] tracking-[12px] font-bold rounded-xl border border-slate-200 focus:border-black outline-none" placeholder="000000" maxLength={6} value={form.code} onChange={e=>setForm({...form, code: e.target.value.replace(/\D/g,'')})} required />
          )}
          {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">{error}</p>}
          <button disabled={loading} type="submit" className="w-full h-12 bg-black text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-60">
            {loading ? <Loader2 className="animate-spin" size={18}/> : <>{mode === 'signin' || mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Verify'} <ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          {(mode === 'signin' || mode === 'login') && <><span>Don't have account? </span><button onClick={()=>changeMode('register')} className="text-black font-medium">Register</button><br/><button onClick={()=>changeMode('forgot')} className="mt-2 text-slate-400">Forgot password?</button></>}
          {mode === 'register' && <><span>Already have account? </span><button onClick={()=>changeMode('signin')} className="text-black font-medium">Sign in</button></>}
          {(mode === 'verifyEmail' || mode === 'verifyOtp') && <><button onClick={resend} className="text-black font-medium">Resend code</button> • <button onClick={()=>changeMode('signin')} className="text-slate-400 ml-2">Back to login</button></>}
          {mode === 'forgot' && <button onClick={()=>changeMode('signin')} className="text-black font-medium">Back to sign in</button>}
        </div>
      </motion.div>
    </div>
  );
}

