import React, { useState, useEffect } from 'react';
import { Flame, Dumbbell, Clock, ArrowRight, Play, CheckCircle2, Calendar, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBrand } from '../../context/BrandContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/api';
import { Routine, WorkoutHistoryEntry, Student } from '../../types';

interface HomeViewProps {
  onStartWorkout: (routine?: Routine) => void;
  onNavigateToTab: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onStartWorkout, onNavigateToTab }) => {
  const { currentUser } = useAuth();
  const { brand } = useBrand();
  const { t, formatDate, formatWeight } = useLanguage();

  const student = currentUser as Student;

  const [todayRoutine, setTodayRoutine] = useState<Routine | null>(null);
  const [recentHistory, setRecentHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      if (!student) return;
      try {
        const routines = await api.getRoutines(student.id);
        const assigned = routines[0] || (await api.getRoutines())[0] || null;
        setTodayRoutine(assigned);

        const history = await api.getWorkoutHistory(student.id);
        setRecentHistory(history);
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadHomeData();
  }, [student]);

  // Dynamic greeting based on current local time
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greetingMorning');
    if (hour < 18) return t('home.greetingAfternoon');
    return t('home.greetingEvening');
  };

  const streakDays = student?.currentStreakDays || 0;
  const lastWorkout = recentHistory[0];

  // Days of week indicators (S T Q Q S S D / L M M J V S D)
  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <div className="space-y-6 pb-28 animate-fadeIn">
      {/* 1. Header Greeting & Streak Flame Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        {/* Glow accent */}
        <div
          className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: brand.primaryColor }}
        />

        <div className="flex items-start justify-between relative z-10">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
              {getGreeting()},
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
              {student?.name?.split(' ')[0] || 'Atleta'}!
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {brand.tagline}
            </p>
          </div>

          {/* Flame streak badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-lg">
            <Flame className="w-5 h-5 fill-amber-500 text-amber-500 animate-pulse" />
            <div className="text-right">
              <span className="text-base font-black leading-none">{streakDays}</span>
              <span className="block text-[9px] font-bold uppercase tracking-wider text-amber-300">
                {t('common.streakDays')}
              </span>
            </div>
          </div>
        </div>

        {/* Weekly streak day tracker dots */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2">
            <span>{t('home.streakDaysLabel')}</span>
            <span className="text-xs text-amber-400 font-bold">{streakDays}/7</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((dayName, idx) => {
              const isTrained = idx < streakDays;
              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center py-2 rounded-xl border text-[11px] transition-all ${
                    isTrained
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
                  }`}
                >
                  <span className="text-[10px] uppercase">{dayName}</span>
                  {isTrained ? (
                    <Flame className="w-3.5 h-3.5 mt-1 fill-amber-500 text-amber-500" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800 mt-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Big "Treino de Hoje" Hero Card with Large Action Button */}
      {todayRoutine ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4" />
              <span>{t('home.todayWorkoutTitle')}</span>
            </span>

            <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-extrabold text-slate-300">
              {t('teacher.division')} {todayRoutine.category}
            </span>
          </div>

          <h3 className="text-xl font-black text-white tracking-tight">
            {todayRoutine.name}
          </h3>

          {todayRoutine.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              {todayRoutine.description}
            </p>
          )}

          {/* Quick stats badges */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{t('home.exercisesCount', { count: todayRoutine.exercises.length })}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{t('home.estimatedTime', { time: 50 })}</span>
            </div>
          </div>

          {/* Exercises preview pills */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {todayRoutine.targetMuscleGroups.map((mg) => (
              <span
                key={mg}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 capitalize"
              >
                {t(`muscles.${mg}`)}
              </span>
            ))}
          </div>

          {/* Large One-Handed "COMEÇAR TREINO" Button */}
          <button
            type="button"
            onClick={() => onStartWorkout(todayRoutine)}
            className="w-full py-4 px-6 rounded-2xl bg-brand-primary hover:brightness-110 active:scale-[0.98] font-black text-white text-base tracking-wider shadow-xl flex items-center justify-center gap-3 transition"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{t('home.startWorkoutButton')}</span>
            <ArrowRight className="w-5 h-5 ml-1" />
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-xl">
          <Dumbbell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">{t('home.noRoutineAssigned')}</p>
        </div>
      )}

      {/* 3. Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {t('home.quickStatsVolume')}
          </span>
          <div className="text-xl font-black text-white mt-1">
            {formatWeight(
              recentHistory.reduce((acc, h) => acc + (h.totalVolumeKg || 0), 0)
            )}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {recentHistory.length} sessões registradas
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {t('profile.weight')}
          </span>
          <div className="text-xl font-black text-white mt-1">
            {formatWeight(student?.currentWeightKg || 80)}
          </div>
          <span className="text-[10px] text-emerald-400 mt-0.5 block">
            Meta: {formatWeight(student?.targetWeightKg || 78)}
          </span>
        </div>
      </div>

      {/* 4. Last Workout Card */}
      {lastWorkout && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('home.lastWorkoutSummary')}
            </span>
            <span className="text-xs text-slate-400">
              {formatDate(lastWorkout.completedAt, { day: '2-digit', month: 'short' })}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-white">{lastWorkout.routineName}</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {lastWorkout.durationMinutes} min · {formatWeight(lastWorkout.totalVolumeKg)} · {lastWorkout.totalSets} {t('common.sets')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigateToTab('history')}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
              aria-label="Ver histórico completo"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 5. Direct WhatsApp Support Link with Gym */}
      <a
        href={`https://wa.me/${brand.whatsapp.replace(/[^0-9]/g, '')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-slate-300 hover:text-white transition shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-bold text-white block">
              {t('home.contactCoach')}
            </span>
            <span className="text-xs text-slate-400">
              {brand.whatsapp}
            </span>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-500" />
      </a>
    </div>
  );
};
