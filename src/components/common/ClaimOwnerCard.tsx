import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useX } from '../../i18n/extraStrings';

/**
 * Ativação do administrador da academia com o código de implantação.
 * Aparece discreta no perfil do aluno; some depois que a academia tem dono.
 */
export const ClaimOwnerCard: React.FC = () => {
  const { claimOwner } = useAuth();
  const x = useX();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-[11px] font-semibold text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1.5 py-1"
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        {x.settings.claimTitle}
      </button>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-brand-primary" />
        {x.settings.claimTitle}
      </h3>
      <p className="text-[11px] text-slate-400">{x.settings.claimHint}</p>
      {error && <p className="text-[11px] font-semibold text-red-400">{error}</p>}
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={x.settings.claimCode}
          aria-label={x.settings.claimCode}
          className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-brand-primary"
        />
        <button
          type="button"
          disabled={!code.trim() || busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            const res = await claimOwner(code);
            if (!res.success) setError(res.error || '—');
            setBusy(false);
          }}
          className="px-4 rounded-xl bg-brand-primary text-white text-xs font-bold disabled:opacity-50"
        >
          {x.settings.claim}
        </button>
      </div>
    </div>
  );
};
