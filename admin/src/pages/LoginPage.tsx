import { useState } from 'react';
import { Lock, PlayCircle } from 'lucide-react';
import { backend } from '../lib/backend';

export default function LoginPage({ onLogin }: { onLogin: (u: { email: string }) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const demo = backend.mode === 'demo';

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await backend.signIn(email.trim(), password);
      const s = await backend.session();
      if (s) onLogin(s);
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="card w-full max-w-sm p-6">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-600 font-black text-white">G</div>
          <div>
            <div className="font-bold text-white">GymApp</div>
            <div className="text-xs text-slate-400">Painel administrativo</div>
          </div>
        </div>
        {demo ? (
          <>
            <p className="text-sm text-slate-300 mb-5">
              Este painel está em <strong>modo demonstração</strong>, com dados de exemplo do Brasil e do Paraguai. Nada aqui é real.
            </p>
            <button onClick={() => submit()} className="btn btn-primary w-full justify-center" disabled={busy}>
              <PlayCircle size={18} /> Entrar na demonstração
            </button>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="label">E-mail</span>
              <input className="field" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label className="block">
              <span className="label">Senha</span>
              <input className="field" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            {err && <p className="text-sm text-rose-300">{err}</p>}
            <button className="btn btn-primary w-full justify-center" disabled={busy}>
              <Lock size={16} /> {busy ? 'Entrando…' : 'Entrar'}
            </button>
            <p className="text-xs text-slate-500">Acesso só para administradores.</p>
          </form>
        )}
      </div>
    </div>
  );
}
