import React, { useMemo, useState } from 'react';
import { LineChart } from 'lucide-react';
import type { Exercise, WorkoutHistoryEntry } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import { useX } from '../../i18n/extraStrings';
import { calculateEpley1RM } from '../../utils/rules';

interface Point {
  t: number;
  best: number;
  e1rm: number;
}

/** Evolução de carga de um exercício: melhor carga e 1RM estimado em cada treino. */
export const ExerciseProgressChart: React.FC<{ history: WorkoutHistoryEntry[]; exercises: Exercise[] }> = ({ history, exercises }) => {
  const x = useX();
  const { language, formatDate } = useLanguage();

  const series = useMemo(() => {
    const map = new Map<string, Point[]>();
    for (const h of history) {
      for (const e of h.exercises) {
        const work = e.sets.filter((s) => s.completed && s.weightKg > 0 && s.type !== 'warmup');
        if (!work.length) continue;
        const best = Math.max(...work.map((s) => s.weightKg));
        const e1rm = Math.max(...work.map((s) => calculateEpley1RM(s.weightKg, s.reps)));
        const list = map.get(e.exerciseId) ?? [];
        list.push({ t: Date.parse(h.startedAt), best, e1rm });
        map.set(e.exerciseId, list);
      }
    }
    for (const list of map.values()) list.sort((a, b) => a.t - b.t);
    return map;
  }, [history]);

  const options = useMemo(
    () =>
      [...series.entries()]
        .filter(([, pts]) => pts.length >= 2)
        .sort((a, b) => b[1].length - a[1].length)
        .map(([id]) => id),
    [series]
  );
  const [selected, setSelected] = useState<string | null>(null);
  const id = selected && options.includes(selected) ? selected : options[0];
  const pts = id ? series.get(id)! : [];
  const name = (exId: string) => {
    const e = exercises.find((x) => x.id === exId);
    return e ? e.name[language] || e.name['pt-BR'] : history.flatMap((h) => h.exercises).find((e) => e.exerciseId === exId)?.exerciseName ?? exId;
  };

  const W = 320;
  const H = 150;
  const P = { l: 30, r: 8, t: 10, b: 20 };
  const minT = pts[0]?.t ?? 0;
  const maxT = pts[pts.length - 1]?.t ?? 1;
  const vals = pts.flatMap((p) => [p.best, p.e1rm]);
  const minV = Math.floor((Math.min(...vals, Infinity) * 0.95) / 5) * 5;
  const maxV = Math.ceil((Math.max(...vals, 0) * 1.03) / 5) * 5;
  const sx = (t: number) => P.l + ((t - minT) / Math.max(1, maxT - minT)) * (W - P.l - P.r);
  const sy = (v: number) => P.t + (1 - (v - minV) / Math.max(1, maxV - minV)) * (H - P.t - P.b);
  const line = (k: 'best' | 'e1rm') => pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.t).toFixed(1)} ${sy(p[k]).toFixed(1)}`).join(' ');
  const first = pts[0];
  const last = pts[pts.length - 1];
  const gain = first && last ? last.best - first.best : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5" data-testid="exercise-chart">
      <h3 className="text-base font-bold text-white flex items-center gap-2">
        <LineChart className="w-4 h-4 text-brand-primary" />
        {x.pro.exChart}
      </h3>
      {!id ? (
        <p className="text-xs text-slate-500 mt-2">{x.pro.exChartEmpty}</p>
      ) : (
        <>
          <select
            value={id}
            onChange={(e) => setSelected(e.target.value)}
            aria-label={x.pro.exChart}
            className="mt-3 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
          >
            {options.map((o) => (
              <option key={o} value={o}>
                {name(o)}
              </option>
            ))}
          </select>
          <div className="flex items-end gap-4 mt-3">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">{x.pro.best}</div>
              <div className="text-xl font-black text-white tabular-nums">
                {last.best} kg{' '}
                {gain !== 0 && (
                  <span className={`text-xs font-bold ${gain > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {gain > 0 ? '+' : ''}
                    {gain} kg
                  </span>
                )}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">{x.pro.est1rm}</div>
              <div className="text-xl font-black text-slate-300 tabular-nums">{Math.round(last.e1rm)} kg</div>
            </div>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full mt-2" role="img" aria-label={`${x.pro.exChart}: ${name(id)}`}>
            {[0, 0.5, 1].map((f) => {
              const v = minV + (maxV - minV) * f;
              return (
                <g key={f}>
                  <line x1={P.l} x2={W - P.r} y1={sy(v)} y2={sy(v)} stroke="#1e293b" />
                  <text x={P.l - 4} y={sy(v) + 3} fontSize={8} fill="#64748b" textAnchor="end">
                    {Math.round(v)}
                  </text>
                </g>
              );
            })}
            <path d={line('e1rm')} fill="none" stroke="#64748b" strokeWidth={1.5} strokeDasharray="3 3" />
            <path d={line('best')} fill="none" stroke="var(--brand-primary)" strokeWidth={2.2} strokeLinejoin="round" />
            {pts.map((p) => (
              <circle key={p.t} cx={sx(p.t)} cy={sy(p.best)} r={2.4} fill="var(--brand-primary)" />
            ))}
            <text x={P.l} y={H - 4} fontSize={8} fill="#64748b">
              {formatDate(new Date(minT).toISOString(), { day: '2-digit', month: 'short' })}
            </text>
            <text x={W - P.r} y={H - 4} fontSize={8} fill="#64748b" textAnchor="end">
              {formatDate(new Date(maxT).toISOString(), { day: '2-digit', month: 'short' })}
            </text>
          </svg>
          <div className="flex gap-4 text-[10px] text-slate-400 mt-1">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-brand-primary inline-block" /> {x.pro.best}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 border-t border-dashed border-slate-500 inline-block" /> {x.pro.est1rm}
            </span>
          </div>
        </>
      )}
    </div>
  );
};
