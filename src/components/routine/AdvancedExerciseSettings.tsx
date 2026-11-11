import React, { useState } from 'react';
import { ChevronDown, Link2, X } from 'lucide-react';
import type { Exercise, RoutineExercise } from '../../types';
import { useX } from '../../i18n/extraStrings';
import { ExercisePicker } from '../exercise/ExercisePicker';

const chip = (on: boolean) =>
  `px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
    on ? 'bg-brand-primary text-white border-transparent' : 'bg-slate-900 border-slate-800 text-slate-400'
  }`;
const label = 'text-[10px] text-slate-400 font-bold block mb-1';
const field = 'w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-center font-bold text-white text-xs';

/** Tipo, técnica, aquecimento, bi-set, substituto e progressão de um exercício da ficha. */
export const AdvancedExerciseSettings: React.FC<{
  re: RoutineExercise;
  exercises: Exercise[];
  isLast: boolean;
  onChange: (u: Partial<RoutineExercise>) => void;
}> = ({ re, exercises, isLast, onChange }) => {
  const x = useX();
  const kind = re.kind ?? 'reps';
  const tech = re.technique ?? 'normal';
  const prog = re.progression ?? 'none';
  const hasAdvanced =
    kind !== 'reps' || tech !== 'normal' || !!re.warmupSets || !!re.groupWithNext || !!re.alternativeId || prog !== 'none';
  const [open, setOpen] = useState(false);
  const muscle = exercises.find((e) => e.id === re.exerciseId)?.muscleGroup;

  const summary = [
    kind !== 'reps' && x.pro.kind[kind],
    tech !== 'normal' && x.pro.tech[tech],
    re.warmupSets && `${re.warmupSets}× ${x.pro.warmupSet}`,
    re.groupWithNext && x.pro.biset,
    re.alternativeId && '⇄',
    prog !== 'none' && x.pro.prog[prog],
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-[11px] font-bold"
      >
        <span className={hasAdvanced ? 'text-brand-primary' : 'text-slate-400'}>
          {x.pro.advanced}
          {summary && <span className="font-semibold text-slate-400"> · {summary}</span>}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-2.5 pb-2.5 space-y-2.5">
          <div>
            <span className={label}>{x.pro.kindLabel}</span>
            <div className="flex flex-wrap gap-1.5">
              {(['reps', 'time', 'cardio'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={chip(kind === k)}
                  onClick={() =>
                    onChange({
                      kind: k,
                      durationSec: k === 'reps' ? undefined : re.durationSec ?? (k === 'time' ? 30 : 600),
                      ...(k === 'cardio' ? { sets: 1, restSeconds: 0 } : {}),
                    })
                  }
                >
                  {x.pro.kind[k]}
                </button>
              ))}
            </div>
          </div>

          {kind !== 'reps' && (
            <div className="w-1/2">
              <span className={label}>{kind === 'time' ? x.pro.seconds : x.pro.minutes}</span>
              <input
                type="number"
                min={1}
                aria-label={kind === 'time' ? x.pro.seconds : x.pro.minutes}
                className={field}
                value={kind === 'time' ? re.durationSec ?? 30 : Math.round((re.durationSec ?? 600) / 60)}
                onChange={(e) => {
                  const v = Math.max(1, parseInt(e.target.value) || 1);
                  onChange({ durationSec: kind === 'time' ? v : v * 60 });
                }}
              />
            </div>
          )}

          {kind === 'reps' && (
            <>
              <div>
                <span className={label}>{x.pro.techLabel}</span>
                <div className="flex flex-wrap gap-1.5">
                  {(['normal', 'dropset', 'restpause'] as const).map((t) => (
                    <button key={t} type="button" className={chip(tech === t)} onClick={() => onChange({ technique: t })}>
                      {x.pro.tech[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className={label}>{x.pro.warmup}</span>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    aria-label={x.pro.warmup}
                    className={field}
                    value={re.warmupSets ?? 0}
                    onChange={(e) => onChange({ warmupSets: Math.min(5, Math.max(0, parseInt(e.target.value) || 0)) })}
                  />
                </div>
                {prog !== 'none' && (
                  <div>
                    <span className={label}>{x.pro.increment}</span>
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      aria-label={x.pro.increment}
                      className={field}
                      value={re.incrementKg ?? 2.5}
                      onChange={(e) => onChange({ incrementKg: Math.max(0.5, parseFloat(e.target.value) || 2.5) })}
                    />
                  </div>
                )}
              </div>

              <div>
                <span className={label}>{x.pro.progLabel}</span>
                <div className="flex flex-wrap gap-1.5">
                  {(['none', 'linear', 'double'] as const).map((p) => (
                    <button key={p} type="button" className={chip(prog === p)} onClick={() => onChange({ progression: p })}>
                      {x.pro.prog[p]}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{x.pro.progHint[prog]}</p>
              </div>
            </>
          )}

          {!isLast && (
            <label className="flex items-center gap-2 text-[11px] text-slate-300">
              <input
                type="checkbox"
                checked={!!re.groupWithNext}
                onChange={(e) => onChange({ groupWithNext: e.target.checked })}
                className="accent-[var(--brand-primary)]"
              />
              <Link2 className="w-3.5 h-3.5 text-brand-primary" />
              <span>
                <b>{x.pro.groupNext}</b> <span className="text-slate-500">· {x.pro.groupHint}</span>
              </span>
            </label>
          )}

          <div>
            <span className={label}>{x.pro.alternative}</span>
            <div className="flex items-center gap-1.5">
              <ExercisePicker
                value={re.alternativeId ?? ''}
                exercises={exercises}
                placeholder={x.pro.noAlternative}
                initialMuscle={muscle}
                onChange={(id) => onChange({ alternativeId: id === re.exerciseId ? undefined : id })}
              />
              {re.alternativeId && (
                <button
                  type="button"
                  aria-label={x.pro.noAlternative}
                  onClick={() => onChange({ alternativeId: undefined })}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
