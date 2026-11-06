import React, { useState } from 'react';
import {
  Baby,
  Mail,
  Lock,
  LogIn,
  Loader2,
  ShieldCheck,
  UserCog,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Database,
  KeyRound
} from 'lucide-react';
import { api } from '../services/api';
import { DEMO_PASSWORD } from '../services/firebase';

interface LoginViewProps {
  onSignedIn: () => void;
  notice?: string;
}

const DEMO_LOGINS = [
  { role: 'ADMIN' as const, email: 'admin@creche.dz', label: 'مدير' },
  { role: 'EDUCATOR' as const, email: 'educator@creche.dz', label: 'مربية' },
  { role: 'ACCOUNTANT' as const, email: 'accountant@creche.dz', label: 'محاسب' }
];

export const LoginView: React.FC<LoginViewProps> = ({ onSignedIn, notice }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setSubmitting(true);
    try {
      await api.login(email.trim(), password);
      onSignedIn();
    } catch (err: any) {
      setError(err?.message || 'فشل تسجيل الدخول');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSeedDemoAccounts = async () => {
    setError('');
    setInfo('');
    setSeeding(true);
    try {
      const res = await api.ensureDemoAccounts();
      const createdCount = res.created.length;
      const skippedCount = res.skipped.length;
      setInfo(
        `تمت التهيئة: ${createdCount} حساب جديد${skippedCount ? `، و${skippedCount} موجود مسبقاً` : ''}. ` +
          `كلمة المرور: ${DEMO_PASSWORD}`
      );
    } catch (err: any) {
      const msg = err?.message || String(err);
      setError(
        msg.includes('PERMISSION_DENIED') || msg.includes('permission_denied')
          ? 'رُفض الوصول من قاعدة البيانات — تأكد من نشر database.rules.json وتفعيل Email/Password في Firebase Auth'
          : `فشل تهيئة الحسابات: ${msg}`
      );
    } finally {
      setSeeding(false);
    }
  };

  const fillDemo = (e: string) => {
    setEmail(e);
    setPassword(DEMO_PASSWORD);
    setError('');
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex items-center justify-center px-4 py-10 font-sans" dir="rtl">
      {/* زخرفة خلفية */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-emerald-100/60 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* الشعار والعنوان */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25 mb-4">
            <Baby className="w-8 h-8" strokeWidth={1.8} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Crèche Manager DZ</h1>
          <p className="text-sm text-slate-500 mt-1">منصة تسيير الحضانات ورياض الأطفال في الجزائر</p>
        </div>

        {/* بطاقة تسجيل الدخول */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 sm:p-7 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">تسجيل الدخول</h2>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
              <Database className="w-3.5 h-3.5" />
              Firebase Realtime
            </span>
          </div>

          {notice && (
            <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
              <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0" />
              <span>{notice}</span>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
              <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="flex items-start gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
              <CheckCircle2 className="w-4.5 h-4.5 mt-0.5 shrink-0" />
              <span>{info}</span>
            </div>
          )}

          {/* البريد */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-bold text-slate-600">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                dir="ltr"
                placeholder="admin@creche.dz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none pr-11 pl-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-all text-left"
              />
            </div>
          </div>

          {/* كلمة المرور */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-bold text-slate-600">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                dir="ltr"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none pr-11 pl-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-all text-left"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60 text-white font-bold text-sm py-3 transition-all shadow-lg shadow-blue-600/25"
          >
            {submitting ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <LogIn className="w-4.5 h-4.5" />}
            دخول إلى المنصة
          </button>

          {/* حسابات العرض التجريبية */}
          <div className="pt-1 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 mb-2 mt-3 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> حسابات العرض (كلمة المرور: {DEMO_PASSWORD})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_LOGINS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => fillDemo(acc.email)}
                  className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-800 text-[11px] font-semibold py-2 px-2 transition-all leading-tight"
                >
                  {acc.label}
                  <span className="block text-[9px] font-normal text-slate-400 mt-0.5" dir="ltr">{acc.email}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSeedDemoAccounts}
              disabled={seeding}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-blue-800 text-xs font-semibold py-2.5 transition-all disabled:opacity-60"
            >
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              تهيئة حسابات العرض في Firebase (أول مرة فقط)
            </button>
          </div>
        </form>

        {/* تذييل */}
        <div className="mt-5 flex items-center justify-center gap-4 text-[10px] text-slate-400">
          <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> مصادقة Firebase Auth</span>
          <span className="inline-flex items-center gap-1"><Database className="w-3.5 h-3.5 text-blue-500" /> مزامنة فورية عبر Realtime Database</span>
          <span className="inline-flex items-center gap-1"><UserCog className="w-3.5 h-3.5 text-violet-500" /> صلاحيات ADMIN / ACCOUNTANT / EDUCATOR</span>
        </div>
      </div>
    </div>
  );
};
