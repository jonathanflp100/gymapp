import React, { useEffect, useState } from 'react';
import { BellRing, BellOff, Send } from 'lucide-react';
import { pushState, enablePush, disablePush, testPush, type PushState } from '../../services/push';
import { useX } from '../../i18n/extraStrings';
import { useBrand } from '../../context/BrandContext';

/** Ativar/desativar notificações no celular (aula, avisos e lembrete de treino). */
export const PushCard: React.FC = () => {
  const x = useX();
  const { brand } = useBrand();
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    pushState().then(setState).catch(() => setState('unsupported'));
  }, []);

  const run = async (fn: () => Promise<PushState | void>) => {
    setBusy(true);
    try {
      const r = await fn();
      if (r) setState(r);
    } catch {
      setState(await pushState().catch(() => 'unsupported' as const));
    } finally {
      setBusy(false);
    }
  };

  if (!state) return null;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3" data-testid="push-card">
      <div className="flex items-start gap-3">
        <span
          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
            state === 'on' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-brand-primary-subtle text-brand-primary'
          }`}
        >
          {state === 'on' ? <BellRing className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-black text-white">{x.pro.push}</h3>
          <p className="text-[11px] text-slate-400">
            {state === 'unsupported' ? x.pro.pushUnsupported : state === 'denied' ? x.pro.pushDenied : x.pro.pushHint}
          </p>
        </div>
      </div>
      {state === 'off' && (
        <button
          type="button"
          disabled={busy}
          onClick={() => run(enablePush)}
          className="w-full py-2.5 rounded-xl bg-brand-primary text-white text-sm font-black disabled:opacity-50"
        >
          {x.pro.pushOn}
        </button>
      )}
      {state === 'on' && (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => testPush(x.pro.pushTestTitle, x.pro.pushTestBody, brand.logoUrl || '/icon.svg'))}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-100 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            {x.pro.pushTest}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(disablePush)}
            className="px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-950 border border-slate-800"
          >
            {x.pro.pushOff}
          </button>
        </div>
      )}
    </div>
  );
};
