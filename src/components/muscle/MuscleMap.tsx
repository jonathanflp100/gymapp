import React, { useState } from 'react';
import { MuscleGroup, MuscleFatigueScore } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import { useBrand } from '../../context/BrandContext';

interface MuscleMapProps {
  stimulusData: Record<MuscleGroup, MuscleFatigueScore>;
  interactive?: boolean;
}

export const MuscleMap: React.FC<MuscleMapProps> = ({ stimulusData, interactive = true }) => {
  const { t } = useLanguage();
  const { brand } = useBrand();
  const [view, setView] = useState<'front' | 'back'>('front');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);

  const getIntensityColor = (group: MuscleGroup): string => {
    const data = stimulusData[group];
    const intensity = data?.intensity || 'none';

    switch (intensity) {
      case 'high':
        return brand.primaryColor;
      case 'moderate':
        return brand.accentColor || brand.primaryColor;
      case 'light':
        return `${brand.primaryColor}88`; // 50% opacity
      case 'none':
      default:
        return '#334155'; // Dark slate
    }
  };

  const getIntensityOpacity = (group: MuscleGroup): number => {
    const data = stimulusData[group];
    switch (data?.intensity) {
      case 'high':
        return 1.0;
      case 'moderate':
        return 0.85;
      case 'light':
        return 0.55;
      case 'none':
      default:
        return 0.25;
    }
  };

  const handleMuscleClick = (group: MuscleGroup) => {
    if (!interactive) return;
    setSelectedMuscle((prev) => (prev === group ? null : group));
  };

  const selectedData = selectedMuscle ? stimulusData[selectedMuscle] : null;

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
      {/* Header with view switcher */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>{t('evolution.muscleMapTitle')}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{t('evolution.muscleMapSubtitle')}</p>
        </div>

        {/* Toggle Button: Frente / Costas */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setView('front')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              view === 'front'
                ? 'bg-brand-primary text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('evolution.frontView')}
          </button>
          <button
            type="button"
            onClick={() => setView('back')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              view === 'back'
                ? 'bg-brand-primary text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('evolution.backView')}
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative flex justify-center py-4 bg-slate-950/60 rounded-2xl border border-slate-800/50">
        <svg
          viewBox="0 0 240 380"
          className="w-56 h-80 drop-shadow-lg transition-all duration-300"
          style={{ overflow: 'visible' }}
        >
          {/* Base Neutral Silhouette Outline */}
          <g opacity="0.15" fill="#94A3B8">
            <circle cx="120" cy="38" r="22" />
            <path d="M108 58 L132 58 L142 80 L98 80 Z" />
            <path d="M96 82 L144 82 L140 180 L100 180 Z" />
          </g>

          {view === 'front' ? (
            /* FRONT VIEW */
            <g>
              {/* Head */}
              <circle cx="120" cy="36" r="20" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />

              {/* Trapezius / Neck */}
              <path d="M106 54 L120 48 L134 54 L146 72 L94 72 Z" fill="#1E293B" stroke="#334155" />

              {/* Shoulders (Deltoids - Front & Lateral) */}
              <g
                className="cursor-pointer transition hover:brightness-125"
                onClick={() => handleMuscleClick('shoulders')}
              >
                {/* Left Deltoid */}
                <path
                  d="M92 72 C80 72 74 86 78 106 C84 108 92 98 94 88 Z"
                  fill={getIntensityColor('shoulders')}
                  fillOpacity={getIntensityOpacity('shoulders')}
                  stroke={selectedMuscle === 'shoulders' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
                {/* Right Deltoid */}
                <path
                  d="M148 72 C160 72 166 86 162 106 C156 108 148 98 146 88 Z"
                  fill={getIntensityColor('shoulders')}
                  fillOpacity={getIntensityOpacity('shoulders')}
                  stroke={selectedMuscle === 'shoulders' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
              </g>

              {/* Chest (Pectorals) */}
              <g
                className="cursor-pointer transition hover:brightness-125"
                onClick={() => handleMuscleClick('chest')}
              >
                {/* Left Pec */}
                <path
                  d="M96 76 L118 76 L118 116 C105 118 92 110 90 98 Z"
                  fill={getIntensityColor('chest')}
                  fillOpacity={getIntensityOpacity('chest')}
                  stroke={selectedMuscle === 'chest' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
                {/* Right Pec */}
                <path
                  d="M122 76 L144 76 L150 98 C148 110 135 118 122 116 Z"
                  fill={getIntensityColor('chest')}
                  fillOpacity={getIntensityOpacity('chest')}
                  stroke={selectedMuscle === 'chest' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
              </g>

              {/* Biceps */}
              <g
                className="cursor-pointer transition hover:brightness-125"
                onClick={() => handleMuscleClick('biceps')}
              >
                {/* Left Bicep */}
                <path
                  d="M74 108 C68 116 70 136 76 142 C82 140 84 125 80 110 Z"
                  fill={getIntensityColor('biceps')}
                  fillOpacity={getIntensityOpacity('biceps')}
                  stroke={selectedMuscle === 'biceps' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
                {/* Right Bicep */}
                <path
                  d="M166 108 C172 116 170 136 164 142 C158 140 156 125 160 110 Z"
                  fill={getIntensityColor('biceps')}
                  fillOpacity={getIntensityOpacity('biceps')}
                  stroke={selectedMuscle === 'biceps' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
              </g>

              {/* Forearms (base silhouette) */}
              <path d="M72 144 L62 185 L70 190 L80 146 Z" fill="#1E293B" />
              <path d="M168 144 L178 185 L170 190 L160 146 Z" fill="#1E293B" />

              {/* Abs (Abdominals) */}
              <g
                className="cursor-pointer transition hover:brightness-125"
                onClick={() => handleMuscleClick('abs')}
              >
                {/* 6-pack grid representation */}
                <rect
                  x="104"
                  y="120"
                  width="14"
                  height="16"
                  rx="3"
                  fill={getIntensityColor('abs')}
                  fillOpacity={getIntensityOpacity('abs')}
                  stroke={selectedMuscle === 'abs' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
                <rect
                  x="122"
                  y="120"
                  width="14"
                  height="16"
                  rx="3"
                  fill={getIntensityColor('abs')}
                  fillOpacity={getIntensityOpacity('abs')}
                  stroke={selectedMuscle === 'abs' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />

                <rect
                  x="104"
                  y="140"
                  width="14"
                  height="16"
                  rx="3"
                  fill={getIntensityColor('abs')}
                  fillOpacity={getIntensityOpacity('abs')}
                  stroke={selectedMuscle === 'abs' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
                <rect
                  x="122"
                  y="140"
                  width="14"
                  height="16"
                  rx="3"
                  fill={getIntensityColor('abs')}
                  fillOpacity={getIntensityOpacity('abs')}
                  stroke={selectedMuscle === 'abs' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />

                <rect
                  x="105"
                  y="160"
                  width="13"
                  height="16"
                  rx="3"
                  fill={getIntensityColor('abs')}
                  fillOpacity={getIntensityOpacity('abs')}
                  stroke={selectedMuscle === 'abs' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
                <rect
                  x="122"
                  y="160"
                  width="13"
                  height="16"
                  rx="3"
                  fill={getIntensityColor('abs')}
                  fillOpacity={getIntensityOpacity('abs')}
                  stroke={selectedMuscle === 'abs' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
              </g>

              {/* Pelvis / Hips */}
              <path d="M98 178 L142 178 L136 200 L104 200 Z" fill="#1E293B" />

              {/* Quadriceps (Left & Right) */}
              <g
                className="cursor-pointer transition hover:brightness-125"
                onClick={() => handleMuscleClick('quadriceps')}
              >
                {/* Left Quad */}
                <path
                  d="M96 202 C90 220 90 260 98 278 C108 280 116 265 116 202 Z"
                  fill={getIntensityColor('quadriceps')}
                  fillOpacity={getIntensityOpacity('quadriceps')}
                  stroke={selectedMuscle === 'quadriceps' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
                {/* Right Quad */}
                <path
                  d="M124 202 C124 265 132 280 142 278 C150 260 150 220 144 202 Z"
                  fill={getIntensityColor('quadriceps')}
                  fillOpacity={getIntensityOpacity('quadriceps')}
                  stroke={selectedMuscle === 'quadriceps' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
              </g>

              {/* Knees */}
              <circle cx="107" cy="284" r="5" fill="#1E293B" />
              <circle cx="133" cy="284" r="5" fill="#1E293B" />

              {/* Calves (Front Shin / Calves) */}
              <g
                className="cursor-pointer transition hover:brightness-125"
                onClick={() => handleMuscleClick('calves')}
              >
                <path
                  d="M102 292 C96 310 98 335 104 355 L112 355 C116 335 114 310 112 292 Z"
                  fill={getIntensityColor('calves')}
                  fillOpacity={getIntensityOpacity('calves')}
                  stroke={selectedMuscle === 'calves' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
                <path
                  d="M128 292 C126 310 124 335 128 355 L136 355 C142 335 144 310 138 292 Z"
                  fill={getIntensityColor('calves')}
                  fillOpacity={getIntensityOpacity('calves')}
                  stroke={selectedMuscle === 'calves' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
              </g>
            </g>
          ) : (
            /* BACK VIEW */
            <g>
              {/* Head Back */}
              <circle cx="120" cy="36" r="20" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />

              {/* Back (Upper Traps & Lats) */}
              <g
                className="cursor-pointer transition hover:brightness-125"
                onClick={() => handleMuscleClick('back')}
              >
                {/* Trapezius V-Shape */}
                <path
                  d="M104 54 L120 48 L136 54 L138 90 L120 124 L102 90 Z"
                  fill={getIntensityColor('back')}
                  fillOpacity={getIntensityOpacity('back')}
                  stroke={selectedMuscle === 'back' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
                {/* Left Latissimus */}
                <path
                  d="M100 86 L116 116 L108 152 C98 140 92 110 92 86 Z"
                  fill={getIntensityColor('back')}
                  fillOpacity={getIntensityOpacity('back')}
                  stroke={selectedMuscle === 'back' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
                {/* Right Latissimus */}
                <path
                  d="M140 86 L148 86 C148 110 142 140 132 152 L124 116 Z"
                  fill={getIntensityColor('back')}
                  fillOpacity={getIntensityOpacity('back')}
                  stroke={selectedMuscle === 'back' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
              </g>

              {/* Rear Deltoids */}
              <g
                className="cursor-pointer transition hover:brightness-125"
                onClick={() => handleMuscleClick('shoulders')}
              >
                <path
                  d="M92 74 C82 74 76 86 80 102 C86 98 92 90 94 82 Z"
                  fill={getIntensityColor('shoulders')}
                  fillOpacity={getIntensityOpacity('shoulders')}
                  stroke={selectedMuscle === 'shoulders' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
                <path
                  d="M148 74 C158 74 164 86 160 102 C154 98 148 90 146 82 Z"
                  fill={getIntensityColor('shoulders')}
                  fillOpacity={getIntensityOpacity('shoulders')}
                  stroke={selectedMuscle === 'shoulders' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
              </g>

              {/* Triceps */}
              <g
                className="cursor-pointer transition hover:brightness-125"
                onClick={() => handleMuscleClick('triceps')}
              >
                {/* Left Tricep */}
                <path
                  d="M74 104 C68 114 70 136 78 142 C82 138 84 120 80 106 Z"
                  fill={getIntensityColor('triceps')}
                  fillOpacity={getIntensityOpacity('triceps')}
                  stroke={selectedMuscle === 'triceps' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
                {/* Right Tricep */}
                <path
                  d="M166 104 C172 114 170 136 162 142 C158 138 156 120 160 106 Z"
                  fill={getIntensityColor('triceps')}
                  fillOpacity={getIntensityOpacity('triceps')}
                  stroke={selectedMuscle === 'triceps' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
              </g>

              {/* Lower Back / Erector Spinae */}
              <rect x="112" y="148" width="16" height="32" rx="4" fill="#1E293B" stroke="#334155" />

              {/* Glutes */}
              <g
                className="cursor-pointer transition hover:brightness-125"
                onClick={() => handleMuscleClick('glutes')}
              >
                {/* Left Glute */}
                <path
                  d="M96 182 C92 196 92 216 104 224 C116 226 118 206 118 182 Z"
                  fill={getIntensityColor('glutes')}
                  fillOpacity={getIntensityOpacity('glutes')}
                  stroke={selectedMuscle === 'glutes' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
                {/* Right Glute */}
                <path
                  d="M144 182 C148 196 148 216 136 224 C124 226 122 206 122 182 Z"
                  fill={getIntensityColor('glutes')}
                  fillOpacity={getIntensityOpacity('glutes')}
                  stroke={selectedMuscle === 'glutes' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
              </g>

              {/* Hamstrings (Posterior de Coxa) */}
              <g
                className="cursor-pointer transition hover:brightness-125"
                onClick={() => handleMuscleClick('hamstrings')}
              >
                {/* Left Hamstring */}
                <path
                  d="M96 228 C92 245 94 266 102 278 C110 276 116 260 116 228 Z"
                  fill={getIntensityColor('hamstrings')}
                  fillOpacity={getIntensityOpacity('hamstrings')}
                  stroke={selectedMuscle === 'hamstrings' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
                {/* Right Hamstring */}
                <path
                  d="M144 228 C148 245 146 266 138 278 C130 276 124 260 124 228 Z"
                  fill={getIntensityColor('hamstrings')}
                  fillOpacity={getIntensityOpacity('hamstrings')}
                  stroke={selectedMuscle === 'hamstrings' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
              </g>

              {/* Calves (Gastrocnemius - Back) */}
              <g
                className="cursor-pointer transition hover:brightness-125"
                onClick={() => handleMuscleClick('calves')}
              >
                {/* Left Calf */}
                <path
                  d="M98 290 C90 310 94 335 104 354 L114 354 C116 332 116 310 114 290 Z"
                  fill={getIntensityColor('calves')}
                  fillOpacity={getIntensityOpacity('calves')}
                  stroke={selectedMuscle === 'calves' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
                {/* Right Calf */}
                <path
                  d="M142 290 C150 310 146 335 136 354 L126 354 C124 332 124 310 126 290 Z"
                  fill={getIntensityColor('calves')}
                  fillOpacity={getIntensityOpacity('calves')}
                  stroke={selectedMuscle === 'calves' ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="1.5"
                />
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Selected Muscle Card Detail */}
      {selectedData && (
        <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between animate-fadeIn">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getIntensityColor(selectedData.muscleGroup) }}
              />
              <span className="text-sm font-bold text-white capitalize">
                {t(`muscles.${selectedData.muscleGroup}`)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedData.setsCount} {t('common.sets')} · {selectedData.volumeKg} kg {t('common.volume').toLowerCase()}
            </p>
          </div>
          <span
            className="text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${getIntensityColor(selectedData.muscleGroup)}22`,
              color: getIntensityColor(selectedData.muscleGroup),
              border: `1px solid ${getIntensityColor(selectedData.muscleGroup)}66`,
            }}
          >
            {t(`evolution.legend${selectedData.intensity.charAt(0).toUpperCase() + selectedData.intensity.slice(1)}`)}
          </span>
        </div>
      )}

      {/* Color Legend */}
      <div className="flex items-center justify-around mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: brand.primaryColor }} />
          <span>{t('evolution.legendHigh')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: brand.accentColor || brand.primaryColor, opacity: 0.8 }} />
          <span>{t('evolution.legendModerate')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: `${brand.primaryColor}88` }} />
          <span>{t('evolution.legendLight')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
          <span>{t('evolution.legendNone')}</span>
        </div>
      </div>
    </div>
  );
};
