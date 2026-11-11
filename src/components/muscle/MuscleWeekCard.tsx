import React from 'react';
import type { MuscleFatigueScore, MuscleGroup } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import { useX } from '../../i18n/extraStrings';
import { BodyMap, type Levels } from './BodyMap';

/** Músculos trabalhados nos últimos 7 dias: mapa do corpo + séries por músculo. */
export const MuscleWeekCard: React.FC<{ stimulus: Record<MuscleGroup, MuscleFatigueScore> }> = ({ stimulus }) => {
  const x = useX();
  const { t } = useLanguage();
  const levels: Levels = {};
  for (const [m, s] of Object.entries(stimulus)) levels[m as MuscleGroup] = s.intensity;
  const rows = Object.values(stimulus)
    .filter((s) => s.setsCount > 0)
    .sort((a, b) => b.setsCount - a.setsCount);
  const max = Math.max(1, ...rows.map((r) => r.setsCount));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4" data-testid="muscle-week">
      <h3 className="text-sm font-black text-white">{x.pro.bodyWeek}</h3>
      <BodyMap levels={levels} height={220} legend />
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.muscleGroup} className="flex items-center gap-2 text-xs">
            <span className="w-24 text-slate-300 truncate">{t(`muscles.${r.muscleGroup}`)}</span>
            <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-brand-primary" style={{ width: `${(r.setsCount / max) * 100}%` }} />
            </div>
            <span className="w-14 text-right text-slate-400 tabular-nums">
              {r.setsCount} {t('common.sets')}
            </span>
          </div>
        ))}
        {!rows.length && <p className="text-xs text-slate-500 text-center">{x.pro.bodyLegend.none}</p>}
      </div>
    </div>
  );
};
