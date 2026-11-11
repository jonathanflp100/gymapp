import React, { useEffect, useMemo, useRef } from 'react';
import { CalendarDays } from 'lucide-react';
import type { WorkoutHistoryEntry } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import { useX } from '../../i18n/extraStrings';
import { useBrand } from '../../context/BrandContext';

const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Calendário dos últimos 12 meses: cada quadradinho é um dia, mais forte quanto mais treino. */
export const YearHeatmap: React.FC<{ history: WorkoutHistoryEntry[] }> = ({ history }) => {
  const x = useX();
  const { language } = useLanguage();
  const { brand } = useBrand();

  const { weeks, months, total } = useMemo(() => {
    const perDay = new Map<string, number>();
    for (const h of history) {
      const k = key(new Date(h.startedAt));
      perDay.set(k, (perDay.get(k) ?? 0) + Math.max(1, h.totalSets));
    }
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - 52 * 7 - start.getDay()); // começa num domingo
    const weeks: { date: Date; sets: number }[][] = [];
    const months: { col: number; label: string }[] = [];
    let total = 0;
    const cur = new Date(start);
    let col = 0;
    while (cur <= today) {
      const week: { date: Date; sets: number }[] = [];
      for (let i = 0; i < 7; i++) {
        const sets = cur <= today ? perDay.get(key(cur)) ?? 0 : -1;
        if (sets > 0) total++;
        week.push({ date: new Date(cur), sets });
        if (cur.getDate() === 1) months.push({ col, label: cur.toLocaleDateString(language, { month: 'short' }).replace('.', '') });
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push(week);
      col++;
    }
    return { weeks, months, total };
  }, [history, language]);

  const color = brand.primaryColor || '#DC2626';
  const level = (sets: number) => (sets <= 0 ? 0 : sets < 10 ? 0.35 : sets < 18 ? 0.65 : 1);
  const cell = 9;
  const gap = 2;
  const w = weeks.length * (cell + gap);
  // começa mostrando os meses mais recentes
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth;
  }, [w]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5" data-testid="year-heatmap">
      <h3 className="text-base font-bold text-white flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-brand-primary" />
        {x.pro.heatTitle}
      </h3>
      <p className="text-xs text-slate-400 mt-0.5">{x.pro.heatCount(total)}</p>
      <div className="mt-3 overflow-x-auto pb-1" ref={scroller}>
        <svg width={w} height={7 * (cell + gap) + 14} role="img" aria-label={x.pro.heatCount(total)}>
          {months.map((m) => (
            <text key={`${m.col}-${m.label}`} x={m.col * (cell + gap)} y={9} fontSize={8} fill="#64748b">
              {m.label}
            </text>
          ))}
          {weeks.map((week, c) =>
            week.map((d, r) =>
              d.sets < 0 ? null : (
                <rect
                  key={`${c}-${r}`}
                  x={c * (cell + gap)}
                  y={14 + r * (cell + gap)}
                  width={cell}
                  height={cell}
                  rx={2}
                  fill={d.sets > 0 ? color : '#1e293b'}
                  fillOpacity={d.sets > 0 ? level(d.sets) : 1}
                >
                  <title>{d.date.toLocaleDateString(language)}</title>
                </rect>
              )
            )
          )}
        </svg>
      </div>
      <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-slate-500">
        {x.pro.less}
        {[0, 0.35, 0.65, 1].map((o) => (
          <span key={o} className="w-2.5 h-2.5 rounded-sm" style={{ background: o ? color : '#1e293b', opacity: o || 1 }} />
        ))}
        {x.pro.more}
      </div>
    </div>
  );
};
