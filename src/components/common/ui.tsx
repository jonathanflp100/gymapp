import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

/** Painel que sobe de baixo (mobile) com título e botão de fechar. */
export const Sheet: React.FC<{
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  tall?: boolean;
}> = ({ open, onClose, title, children, tall }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 animate-fadeIn" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col ${
          tall ? 'h-[92vh]' : 'max-h-[92vh]'
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-800/80 shrink-0">
          <div className="min-w-0 flex-1">{title}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 pb-8 flex-1">{children}</div>
      </div>
    </div>
  );
};

/** Aviso rápido no rodapé. Uso: const [toast, show] = useToast(); ... {toast} ... show('ok') */
export function useToast(): [React.ReactNode, (msg: string, tone?: 'ok' | 'warn') => void] {
  const [state, setState] = useState<{ msg: string; tone: 'ok' | 'warn'; id: number } | null>(null);
  useEffect(() => {
    if (!state) return;
    const t = setTimeout(() => setState(null), 2400);
    return () => clearTimeout(t);
  }, [state]);
  const node = state ? (
    <div
      key={state.id}
      role="status"
      className={`fixed left-1/2 -translate-x-1/2 bottom-24 z-[60] px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xl animate-fadeIn ${
        state.tone === 'ok' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-950'
      }`}
    >
      {state.msg}
    </div>
  ) : null;
  return [node, (msg, tone = 'ok') => setState({ msg, tone, id: Date.now() })];
}

export const Stat: React.FC<{ label: string; value: React.ReactNode; hint?: React.ReactNode; accent?: boolean }> = ({
  label,
  value,
  hint,
  accent,
}) => (
  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 min-w-0">
    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide block truncate">{label}</span>
    <div className={`text-base font-black mt-0.5 truncate ${accent ? 'text-brand-primary' : 'text-white'}`}>{value}</div>
    {hint && <div className="text-[10px] text-slate-400 mt-0.5 truncate">{hint}</div>}
  </div>
);

/** Iniciais para avatar. */
export const initials = (name: string) =>
  name
    .replace(/^Prof\.\s*/, '')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
