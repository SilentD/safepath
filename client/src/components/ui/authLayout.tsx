import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: Props) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] p-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-70" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-70" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-[420px] bg-white rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 p-8 md:p-10"
      >
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-white font-bold text-xl">S</div>
        </div>
        <h1 className="text-[26px] font-bold tracking-tight text-slate-900 text-center">{title}</h1>
        {subtitle && <p className="text-[14px] text-slate-500 text-center mt-2 mb-8">{subtitle}</p>}
        {children}
      </motion.div>
    </div>
  );
}