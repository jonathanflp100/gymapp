import React, { useState } from 'react';
import { Dumbbell, Lock, Mail, Key, ArrowRight, Sparkles, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBrand } from '../../context/BrandContext';
import { useLanguage } from '../../i18n/LanguageContext';

export const LoginView: React.FC = () => {
  const { login, quickLoginAsStudent, quickLoginAsTeacher } = useAuth();
  const { brand, brandLogoUrl } = useBrand();
  const { t } = useLanguage();

  const [gymCode, setGymCode] = useState(brand.gymCode);
  const [email, setEmail] = useState('carlos@email.com');
  const [password, setPassword] = useState('123456');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const res = await login(gymCode, email);
    if (!res.success) {
      setErrorMessage(res.error || t('auth.invalidCredentials'));
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center px-4 py-8 safe-bottom safe-top animate-fadeIn">
      <div className="w-full max-w-sm mx-auto space-y-6">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-block p-1 rounded-3xl shadow-2xl relative">
            <img
              src={brandLogoUrl}
              alt={brand.name}
              className="w-20 h-20 rounded-2xl mx-auto shadow-xl border border-white/10 object-cover"
            />
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight">
            {brand.name}
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {brand.tagline}
          </p>
        </div>

        {/* Login Form Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            {/* Gym Code */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {t('auth.gymCodeLabel')}
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={gymCode}
                  onChange={(e) => setGymCode(e.target.value.toUpperCase())}
                  placeholder={t('auth.gymCodePlaceholder')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-brand-primary"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {t('auth.emailLabel')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {t('auth.passwordLabel')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-brand-primary hover:brightness-110 active:scale-95 text-white font-bold text-xs shadow-xl flex items-center justify-center gap-2 transition"
            >
              <span>{isLoading ? t('common.loading') : t('auth.loginButton')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block text-center">
              {t('auth.quickLoginTitle')}
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickLoginAsStudent()}
                className="py-2.5 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-brand-primary" />
                <span>Aluno Demo</span>
              </button>

              <button
                type="button"
                onClick={() => quickLoginAsTeacher()}
                className="py-2.5 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
                <span>Professor Demo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <p className="text-[11px] text-slate-500 text-center">
          Plataforma White-Label para Academias · Versão 1.0 PWA
        </p>
      </div>
    </div>
  );
};
