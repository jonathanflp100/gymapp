import React, { useState } from 'react';
import { LayoutTemplate, ChevronRight, Link2, Timer, Flame } from 'lucide-react';
import { ROUTINE_TEMPLATES, routinesFromTemplate, type RoutineTemplate } from '../../data/routineTemplates';
import { api } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { useX } from '../../i18n/extraStrings';
import { Sheet } from '../common/ui';
import type { Exercise } from '../../types';

const LEVEL_CLS: Record<RoutineTemplate['level'], string> = {
  beginner: 'bg-emerald-500/15 text-emerald-300',
  intermediate: 'bg-sky-500/15 text-sky-300',
  advanced: 'bg-amber-500/15 text-amber-300',
};

/** Lista de modelos de ficha; ao escolher, cria as fichas e devolve quantas foram criadas. */
export const TemplatesSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  teacherId: string;
  exercises: Exercise[];
  onCreated: (count: number) => void;
}> = ({ open, onClose, teacherId, exercises, onCreated }) => {
  const x = useX();
  const { language } = useLanguage();
  const lang = language === 'es-PY' ? 'es-PY' : 'pt-BR';
  const [preview, setPreview] = useState<RoutineTemplate | null>(null);
  const [busy, setBusy] = useState(false);
  const exName = (id: string) => {
    const e = exercises.find((x) => x.id === id);
    return e ? e.name[lang] || e.name['pt-BR'] : id;
  };

  const use = async (t: RoutineTemplate) => {
    setBusy(true);
    try {
      const list = routinesFromTemplate(t, lang, teacherId);
      for (const r of list) await api.saveRoutine(r);
      onCreated(list.length);
      setPreview(null);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={() => {
        setPreview(null);
        onClose();
      }}
      tall
      title={
        <div>
          <h3 className="text-base font-black text-white">{preview ? preview.name[lang] : x.pro.templates}</h3>
          <span className="text-[11px] text-slate-400">{preview ? preview.summary[lang] : x.pro.templatesHint}</span>
        </div>
      }
    >
      {!preview ? (
        <div className="space-y-2" data-testid="templates-list">
          {ROUTINE_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPreview(t)}
              className="w-full text-left bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-primary-subtle text-brand-primary flex items-center justify-center shrink-0">
                <LayoutTemplate className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-black text-white">{t.name[lang]}</span>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${LEVEL_CLS[t.level]}`}>
                    {x.pro.tplLevel[t.level]}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{t.summary[lang]}</p>
                <span className="text-[10px] text-slate-500">{x.pro.tplDays(t.routines.length)}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {preview.routines.map((r) => (
            <div key={r.name[lang]} className="bg-slate-950 border border-slate-800 rounded-2xl p-3">
              <div className="text-xs font-black text-white">{r.name[lang]}</div>
              <ol className="mt-1.5 space-y-1">
                {r.exercises.map((e, i) => (
                  <li key={i} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                    <span className="text-slate-500 w-4 shrink-0">{i + 1}.</span>
                    <span className="truncate flex-1">{exName(e.exerciseId)}</span>
                    {e.groupWithNext && <Link2 className="w-3 h-3 text-brand-primary shrink-0" aria-label={x.pro.biset} />}
                    {e.technique && e.technique !== 'normal' && <Flame className="w-3 h-3 text-amber-400 shrink-0" aria-label={x.pro.tech[e.technique]} />}
                    {e.kind && e.kind !== 'reps' && <Timer className="w-3 h-3 text-sky-400 shrink-0" aria-label={x.pro.kind[e.kind]} />}
                    <span className="text-slate-500 tabular-nums shrink-0">
                      {e.kind === 'cardio'
                        ? `${Math.round((e.durationSec ?? 0) / 60)} ${x.pro.minShort}`
                        : e.kind === 'time'
                          ? `${e.sets}×${e.durationSec}${x.pro.secShort}`
                          : `${e.sets}×${e.reps}`}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setPreview(null)} className="py-3 rounded-2xl bg-slate-800 text-sm font-bold text-slate-200">
              ←
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => use(preview)}
              className="py-3 rounded-2xl bg-brand-primary text-white text-sm font-black disabled:opacity-50"
            >
              {x.pro.useTemplate}
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
};
