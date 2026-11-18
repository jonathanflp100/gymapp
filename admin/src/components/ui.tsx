import { useEffect, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, OctagonAlert, X } from 'lucide-react';
import type { Level } from '../lib/metrics';
import type { Scope } from '../lib/metrics';

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-2xl font-bold text-white num mt-1">{value}</div>
      {hint && (
        <div className={`text-xs mt-1 ${tone === 'good' ? 'text-emerald-400' : tone === 'bad' ? 'text-rose-400' : 'text-slate-500'}`}>{hint}</div>
      )}
    </div>
  );
}

export function ScopeTabs({ value, onChange }: { value: Scope; onChange: (s: Scope) => void }) {
  const opts: { id: Scope; label: string }[] = [
    { id: 'ALL', label: 'Tudo' },
    { id: 'BR', label: '🇧🇷 Brasil' },
    { id: 'PY', label: '🇵🇾 Paraguai' },
  ];
  return (
    <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-1" role="tablist">
      {opts.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${value === o.id ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const LEVEL: Record<Level, { icon: typeof Info; label: string; cls: string }> = {
  good: { icon: CheckCircle2, label: 'Bom', cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
  warning: { icon: AlertTriangle, label: 'Atenção', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
  critical: { icon: OctagonAlert, label: 'Crítico', cls: 'text-rose-300 bg-rose-500/10 border-rose-500/30' },
  info: { icon: Info, label: 'Info', cls: 'text-sky-300 bg-sky-500/10 border-sky-500/30' },
};

export function LevelBadge({ level }: { level: Level }) {
  const L = LEVEL[level];
  const Icon = L.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${L.cls}`}>
      <Icon size={12} /> {L.label}
    </span>
  );
}

export function InsightCard({ level, title, text }: { level: Level; title: string; text: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <LevelBadge level={level} />
        <span className="font-semibold text-slate-100 text-sm">{title}</span>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">{text}</p>
    </div>
  );
}

export function Modal({ open, title, onClose, children, wide }: { open: boolean; title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`card w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'} max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-2xl`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-[#0f172a] px-5 py-3">
          <h2 className="font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="card p-8 text-center text-sm text-slate-400">{children}</div>;
}

export const flag = (c: string) => (c === 'BR' ? '🇧🇷' : c === 'PY' ? '🇵🇾' : '🌎');
