import React, { useState } from 'react';
import { TrendingDown, TrendingUp, Award, Dumbbell, Calendar } from 'lucide-react';
import { WeightRecord, PersonalRecord, Exercise } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import { useBrand } from '../../context/BrandContext';

interface EvolutionChartsProps {
  weightHistory: WeightRecord[];
  personalRecords: PersonalRecord[];
  exercises: Exercise[];
  targetWeightKg: number;
}

export const EvolutionCharts: React.FC<EvolutionChartsProps> = ({
  weightHistory,
  personalRecords,
  exercises,
  targetWeightKg,
}) => {
  const { t, formatDate, formatWeight } = useLanguage();
  const { brand } = useBrand();

  const [selectedPrId, setSelectedPrId] = useState<string>(
    personalRecords[0]?.exerciseId || 'ex-bench-press'
  );

  // Weight progression computations
  const currentWeight = weightHistory[weightHistory.length - 1]?.weightKg || 80;
  const initialWeight = weightHistory[0]?.weightKg || currentWeight;
  const weightDifference = currentWeight - initialWeight;
  const minWeight = Math.min(...weightHistory.map((w) => w.weightKg), targetWeightKg) - 2;
  const maxWeight = Math.max(...weightHistory.map((w) => w.weightKg), targetWeightKg) + 2;
  const weightRange = maxWeight - minWeight || 1;

  // Selected PR details
  const currentPr = personalRecords.find((p) => p.exerciseId === selectedPrId) || personalRecords[0];

  return (
    <div className="space-y-6">
      {/* 1. Body Weight Progression Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-primary" />
              <span>{t('evolution.weightHistoryTitle')}</span>
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-2xl font-black text-white">{weightHistory.length ? formatWeight(currentWeight) : '—'}</span>
              {targetWeightKg > 0 && (
                <span className="text-xs text-slate-400">
                  {t('evolution.targetWeight')}: {formatWeight(targetWeightKg)}
                </span>
              )}
            </div>
          </div>

          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
              weightDifference <= 0
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            {weightDifference <= 0 ? (
              <TrendingDown className="w-3.5 h-3.5" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5" />
            )}
            <span>
              {weightDifference > 0 ? '+' : ''}
              {weightDifference.toFixed(1)} kg
            </span>
          </div>
        </div>

        {/* Responsive SVG Line Chart */}
        <div className="h-44 w-full pt-2">
          <svg viewBox="0 0 340 140" className="w-full h-full overflow-visible">
            {/* Horizontal Grid lines */}
            <line x1="20" y1="20" x2="320" y2="20" stroke="#1E293B" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="20" y1="70" x2="320" y2="70" stroke="#1E293B" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="20" y1="120" x2="320" y2="120" stroke="#1E293B" strokeWidth="1" strokeDasharray="3,3" />

            {/* Target Weight Reference Line */}
            {(() => {
              const targetY = 120 - ((targetWeightKg - minWeight) / weightRange) * 100;
              return (
                <g>
                  <line
                    x1="20"
                    y1={targetY}
                    x2="320"
                    y2={targetY}
                    stroke="#10B981"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                    opacity="0.8"
                  />
                  <text x="325" y={targetY + 3} fill="#10B981" fontSize="9" fontWeight="bold">
                    Meta
                  </text>
                </g>
              );
            })()}

            {/* Coordinates computation */}
            {(() => {
              const count = weightHistory.length;
              if (count === 0) return null;

              const points = weightHistory.map((item, idx) => {
                const x = 30 + (idx / Math.max(count - 1, 1)) * 280;
                const y = 120 - ((item.weightKg - minWeight) / weightRange) * 100;
                return { x, y, ...item };
              });

              const pathD = points.reduce((acc, curr, idx) => {
                return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
              }, '');

              const fillD = `${pathD} L ${points[points.length - 1].x} 130 L ${points[0].x} 130 Z`;

              return (
                <g>
                  {/* Subtle Gradient Area */}
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={brand.primaryColor} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={brand.primaryColor} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d={fillD} fill="url(#weightGrad)" />

                  {/* Main Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={brand.primaryColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Nodes with Values */}
                  {points.map((pt, idx) => (
                    <g key={idx} className="cursor-pointer">
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="4.5"
                        fill="#0F172A"
                        stroke={brand.primaryColor}
                        strokeWidth="2.5"
                      />
                      <text
                        x={pt.x}
                        y={pt.y - 9}
                        textAnchor="middle"
                        fill="#E2E8F0"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        {pt.weightKg}
                      </text>
                      <text
                        x={pt.x}
                        y="135"
                        textAnchor="middle"
                        fill="#64748B"
                        fontSize="8"
                      >
                        {formatDate(pt.date, { day: '2-digit', month: 'numeric' })}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* 2. Personal Records (PRs) & 1RM Calculator */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">{t('evolution.personalRecordsTitle')}</h3>
          </div>
          <span className="text-xs bg-amber-500/10 text-amber-300 font-semibold px-2.5 py-1 rounded-full border border-amber-500/20">
            {personalRecords.length} PRs
          </span>
        </div>

        {/* PR Chips Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {personalRecords.map((pr) => {
            const isSelected = pr.exerciseId === selectedPrId;
            return (
              <button
                key={pr.exerciseId}
                type="button"
                onClick={() => setSelectedPrId(pr.exerciseId)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-brand-primary text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {pr.exerciseName}
              </button>
            );
          })}
        </div>

        {/* Selected PR Details Card */}
        {currentPr && (
          <div className="mt-4 p-4 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                {currentPr.exerciseName}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{currentPr.maxWeightKg} kg</span>
                <span className="text-xs text-slate-400 font-medium">({currentPr.reps} reps)</span>
              </div>
              <p className="text-xs text-emerald-400 font-medium">
                {t('evolution.prEstimated1RM', { weight: String(currentPr.estimatedOneRepMax) })}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">
                {formatDate(currentPr.date, { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <div className="inline-flex items-center gap-1 mt-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                <Dumbbell className="w-3.5 h-3.5" />
                <span>Top Set</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
