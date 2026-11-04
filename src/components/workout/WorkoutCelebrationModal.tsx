import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Flame, Clock, Dumbbell, Award, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useBrand } from '../../context/BrandContext';
import { WorkoutHistoryEntry } from '../../types';

interface WorkoutCelebrationModalProps {
  workout: WorkoutHistoryEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WorkoutCelebrationModal: React.FC<WorkoutCelebrationModalProps> = ({
  workout,
  isOpen,
  onClose,
}) => {
  const { t, formatWeight } = useLanguage();
  const { brand } = useBrand();

  useEffect(() => {
    if (isOpen) {
      // Fire confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: [brand.primaryColor, brand.accentColor, '#F59E0B', '#10B981', '#FFFFFF'],
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [isOpen, brand]);

  if (!isOpen || !workout) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-center">
        {/* Glow behind badge */}
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: brand.primaryColor }}
        />

        {/* Celebration Trophy Badge */}
        <div className="mx-auto w-20 h-20 rounded-3xl flex items-center justify-center mb-4 shadow-xl border border-white/10 relative bg-brand-primary">
          <Trophy className="w-10 h-10 text-white animate-bounce" />
        </div>

        <h2 className="text-2xl font-black tracking-tight text-white">
          {t('workout.workoutCompletedTitle')}
        </h2>
        <p className="text-sm text-slate-400 mt-1.5 max-w-xs mx-auto">
          {t('workout.workoutCompletedSubtitle')}
        </p>

        {/* Routine Name Tag */}
        <div className="inline-block mt-3 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300">
          {workout.routineName}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 my-6">
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 flex flex-col items-center">
            <Dumbbell className="w-5 h-5 text-brand-primary mb-1" />
            <span className="text-base font-extrabold text-white">
              {formatWeight(workout.totalVolumeKg)}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-0.5">
              {t('common.volume')}
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 flex flex-col items-center">
            <Clock className="w-5 h-5 text-amber-500 mb-1" />
            <span className="text-base font-extrabold text-white">
              {workout.durationMinutes} min
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-0.5">
              {t('common.duration')}
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 flex flex-col items-center">
            <Flame className="w-5 h-5 text-emerald-500 mb-1" />
            <span className="text-base font-extrabold text-white">
              {workout.totalSets}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-0.5">
              {t('common.sets')}
            </span>
          </div>
        </div>

        {/* Personal Records Highlight */}
        {workout.personalRecordsBroken && workout.personalRecordsBroken.length > 0 && (
          <div className="mb-6 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-left">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1.5">
              <Award className="w-4 h-4" />
              <span>{t('workout.personalRecordsUnlocked')}</span>
            </div>
            <ul className="text-xs text-amber-200 font-medium space-y-1 list-disc list-inside">
              {workout.personalRecordsBroken.map((pr, idx) => (
                <li key={idx}>{pr}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-4 px-6 rounded-2xl bg-brand-primary hover:brightness-110 active:scale-[0.99] font-bold text-white text-sm shadow-xl flex items-center justify-center gap-2 transition"
        >
          <span>{t('workout.finishModalClose')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
