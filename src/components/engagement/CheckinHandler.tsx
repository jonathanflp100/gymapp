import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { engagement } from '../../services/engagementApi';
import { useX } from '../../i18n/extraStrings';

export const PENDING_CHECKIN_KEY = 'gymapp.pendingCheckin';
export const CHECKIN_EVENT = 'gymapp:checkin';

// Lido na carga do app: guarda o código do QR até o aluno entrar e limpa a URL.
(() => {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const code = url.searchParams.get('checkin');
  if (!code) return;
  try {
    sessionStorage.setItem(PENDING_CHECKIN_KEY, code);
  } catch {
    /* sem storage */
  }
  url.searchParams.delete('checkin');
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);
})();

export const hasPendingCheckin = () => {
  try {
    return !!sessionStorage.getItem(PENDING_CHECKIN_KEY);
  } catch {
    return false;
  }
};

/** Conclui o check-in lido no QR da recepção assim que o aluno está logado. */
export const CheckinHandler: React.FC<{ onDone?: () => void }> = ({ onDone }) => {
  const x = useX();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let code: string | null = null;
    try {
      code = sessionStorage.getItem(PENDING_CHECKIN_KEY);
      sessionStorage.removeItem(PENDING_CHECKIN_KEY);
    } catch {
      /* sem storage */
    }
    if (!code) return;
    engagement
      .checkin(code)
      .then((r) => {
        setResult({ ok: true, text: r.already ? x.engage.chkAlready : x.engage.chkOk });
        // avisa os cartões da tela inicial (check-in e desafios) para recarregar
        window.dispatchEvent(new Event(CHECKIN_EVENT));
      })
      .catch((e: { status?: number; message?: string }) =>
        setResult({ ok: false, text: e.status === 400 ? x.engage.chkInvalid : `${x.engage.chkError}: ${e.message || e}` })
      )
      .finally(() => onDone?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setResult(null), 4000);
    return () => clearTimeout(t);
  }, [result]);

  if (!result) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" role="alertdialog" onClick={() => setResult(null)}>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center max-w-xs w-full animate-fadeIn">
        {result.ok ? (
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
        ) : (
          <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto" />
        )}
        <p className="mt-3 text-base font-extrabold text-white" data-testid="checkin-result">
          {result.text}
        </p>
      </div>
    </div>
  );
};
