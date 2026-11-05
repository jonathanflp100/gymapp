import React, { useState } from 'react';
import { Lock, Mail, User, ArrowRight, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBrand } from '../../context/BrandContext';
import { useLanguage } from '../../i18n/LanguageContext';

/** Tela de entrada do modo real (servidor openGym): entrar ou criar conta com senha. */
export const RealAuthView: React.FC = () => {
  const { realSignIn, realRegister } = useAuth();
  const { brand, brandLogoUrl } = useBrand();
  const { language, setLanguage } = useLanguage();
  const es = language === 'es-PY';
  const tx = (pt: string, spa: string) => (es ? spa : pt);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === 'register' && password.length < 10) {
      setError(tx('A senha precisa ter pelo menos 10 caracteres.', 'La contraseña debe tener al menos 10 caracteres.'));
      return;
    }
    setBusy(true);
    const res = mode === 'login' ? await realSignIn(name, password) : await realRegister(name, password, email, code);
    if (!res.success) setError(res.error || tx('Não foi possível entrar.', 'No se pudo ingresar.'));
    setBusy(false);
  };

  const input =
    'w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center px-4 py-8 safe-bottom safe-top animate-fadeIn">
      <div className="w-full max-w-sm mx-auto space-y-6">
        <div className="text-center space-y-2">
          <img
            src={brandLogoUrl}
            alt={brand.name}
            className="w-20 h-20 rounded-2xl mx-auto shadow-xl border border-white/10 object-cover"
          />
          <h1 className="text-2xl font-black text-white tracking-tight">{brand.name}</h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">{brand.tagline}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`py-2 rounded-xl text-xs font-bold transition ${
                  mode === m ? 'bg-brand-primary text-white' : 'text-slate-400'
                }`}
              >
                {m === 'login' ? tx('Entrar', 'Ingresar') : tx('Criar conta', 'Crear cuenta')}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            {error && (
              <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold">
                {error}
              </div>
            )}

            <label className="block">
              <span className="text-xs font-bold text-slate-300 block mb-1">
                {mode === 'login' ? tx('Nome ou e-mail', 'Nombre o e-mail') : tx('Seu nome', 'Tu nombre')}
              </span>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input value={name} onChange={(e) => setName(e.target.value)} className={input} required maxLength={40} autoComplete="username" />
              </div>
            </label>

            {mode === 'register' && (
              <label className="block">
                <span className="text-xs font-bold text-slate-300 block mb-1">{tx('E-mail (opcional)', 'E-mail (opcional)')}</span>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} autoComplete="email" />
                </div>
              </label>
            )}

            <label className="block">
              <span className="text-xs font-bold text-slate-300 block mb-1">{tx('Senha', 'Contraseña')}</span>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={input}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
              {mode === 'register' && (
                <span className="text-[10px] text-slate-500 mt-1 block">{tx('Mínimo de 10 caracteres.', 'Mínimo 10 caracteres.')}</span>
              )}
            </label>

            {mode === 'register' && (
              <label className="block">
                <span className="text-xs font-bold text-slate-300 block mb-1">{tx('Código de convite (se a academia pedir)', 'Código de invitación (si el gimnasio lo pide)')}</span>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input value={code} onChange={(e) => setCode(e.target.value.trim())} className={`${input} font-mono`} />
                </div>
              </label>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-brand-primary hover:brightness-110 active:scale-95 text-white font-bold text-xs shadow-xl flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              <span>
                {busy ? tx('Aguarde...', 'Espere...') : mode === 'login' ? tx('ENTRAR', 'INGRESAR') : tx('CRIAR CONTA', 'CREAR CUENTA')}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="flex justify-center gap-2 pt-2 border-t border-slate-800/80">
            {(['pt-BR', 'es-PY'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold ${language === l ? 'bg-slate-700 text-white' : 'text-slate-500'}`}
              >
                {l === 'pt-BR' ? '🇧🇷 Português' : '🇵🇾 Español'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
