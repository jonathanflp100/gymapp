import { useX } from '../../i18n/extraStrings';
import { ExerciseGuideSheet } from '../../components/exercise/ExerciseGuideSheet';
import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Check,
  Plus,
  Clock,
  Flag,
  Sparkles,
  PlayCircle,
  Link2,
  Repeat,
  Flame,
  TrendingUp,
  Sun,
  WifiOff,
  Timer,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/api';
import { Routine, RoutineExercise, Exercise, SetLog, WorkoutHistoryEntry, Student, MuscleGroup } from '../../types';
import { calculateTotalVolume } from '../../utils/rules';
import { lastPerformance, suggestLoad, type LoadSuggestion } from '../../utils/progression';
import { RestTimer } from '../../components/workout/RestTimer';
import { WorkoutCelebrationModal } from '../../components/workout/WorkoutCelebrationModal';
import { ExercisePicker } from '../../components/exercise/ExercisePicker';
import {
  finishWorkoutSafe,
  loadActiveWorkout,
  saveActiveWorkout,
  useOnline,
  useWakeLock,
} from '../../services/offline';
import { useToast } from '../../components/common/ui';
import { BodyMap, levelsFromMuscles, useRoutineMuscles } from '../../components/muscle/BodyMap';

interface WorkoutViewProps {
  initialRoutine?: Routine | null;
  onFinishWorkoutSuccess: () => void;
}

interface ActiveExerciseState {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  targetRestSeconds: number;
  notes?: string;
  kind: 'reps' | 'time' | 'cardio';
  technique: 'normal' | 'dropset' | 'restpause';
  groupWithNext: boolean;
  alternativeId?: string;
  /** exercício original da ficha (para a troca) */
  originalId: string;
  suggestion?: LoadSuggestion;
  sets: SetLog[];
}

const kg = (n: number) => (Math.round(n * 100) / 100).toString().replace('.', ',');

export const WorkoutView: React.FC<WorkoutViewProps> = ({ initialRoutine, onFinishWorkoutSuccess }) => {
  const gx = useX();
  const px = gx.pro;
  const [guideExerciseId, setGuideExerciseId] = useState<string | null>(null);
  const [guideExercise, setGuideExercise] = useState<Exercise | null>(null);
  useEffect(() => {
    if (!guideExerciseId) return setGuideExercise(null);
    void api.getExerciseById(guideExerciseId).then(setGuideExercise);
  }, [guideExerciseId]);

  const { currentUser } = useAuth();
  const { language, t, formatWeight } = useLanguage();
  const student = currentUser as Student;
  const online = useOnline();
  const [toast, showToast] = useToast();

  const [availableRoutines, setAvailableRoutines] = useState<Routine[]>([]);
  const [exercisesCatalog, setExercisesCatalog] = useState<Exercise[]>([]);
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(initialRoutine || null);

  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [workoutExercises, setWorkoutExercises] = useState<ActiveExerciseState[]>([]);

  const [isRestTimerOpen, setIsRestTimerOpen] = useState(false);
  const [currentRestDuration, setCurrentRestDuration] = useState(60);
  const [restKey, setRestKey] = useState(0);

  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [completedWorkoutSummary, setCompletedWorkoutSummary] = useState<WorkoutHistoryEntry | null>(null);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const wakeLock = useWakeLock(isWorkoutActive);

  const nameOf = (ex: Exercise | undefined) =>
    ex ? ex.name[language] || ex.name['pt-BR'] : language === 'es-PY' ? 'Ejercicio' : 'Exercício';

  // Carrega fichas, exercícios e histórico; retoma um treino em andamento
  useEffect(() => {
    async function initData() {
      if (!student) return;
      const routines = await api.getRoutines(student.id);
      const allRoutines = routines.length > 0 ? routines : await api.getRoutines();
      setAvailableRoutines(allRoutines);
      const [exercises, hist] = await Promise.all([
        api.getExercises(),
        api.getWorkoutHistory(student.id).catch(() => [] as WorkoutHistoryEntry[]),
      ]);
      setExercisesCatalog(exercises);
      setHistory(hist);

      const saved = loadActiveWorkout<ActiveExerciseState>(student.id);
      if (saved && !initialRoutine) {
        setWorkoutExercises(saved.exercises);
        setSelectedRoutine(allRoutines.find((r) => r.id === saved.routineId) ?? null);
        const start = new Date(saved.startedAt);
        setWorkoutStartTime(start);
        setElapsedSeconds(Math.floor((Date.now() - start.getTime()) / 1000));
        setIsWorkoutActive(true);
        return;
      }
      if (initialRoutine) startWorkoutFromRoutine(initialRoutine, exercises, hist);
      else if (allRoutines.length > 0 && !isWorkoutActive) setSelectedRoutine(allRoutines[0]);
    }
    initData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id, initialRoutine]);

  // Cronômetro do treino
  useEffect(() => {
    if (!isWorkoutActive || !workoutStartTime) return;
    const tick = () => setElapsedSeconds(Math.floor((Date.now() - workoutStartTime.getTime()) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isWorkoutActive, workoutStartTime]);

  // Guarda o treino em andamento no aparelho a cada mudança
  useEffect(() => {
    if (!isWorkoutActive || !workoutStartTime || !student) return;
    saveActiveWorkout({
      userId: student.id,
      routineId: selectedRoutine?.id,
      routineName: selectedRoutine?.name || t('workout.customWorkoutName'),
      startedAt: workoutStartTime.toISOString(),
      exercises: workoutExercises,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutExercises, isWorkoutActive]);

  const buildExercise = (
    re: RoutineExercise,
    exerciseId: string,
    catalog: Exercise[],
    hist: WorkoutHistoryEntry[]
  ): ActiveExerciseState => {
    const ex = catalog.find((e) => e.id === exerciseId);
    const kind = re.kind ?? 'reps';
    const technique = re.technique ?? 'normal';
    let sets: SetLog[];
    let suggestion: LoadSuggestion | undefined;
    if (kind === 'cardio') {
      sets = [{ setNumber: 1, weightKg: 0, reps: 0, durationSec: re.durationSec ?? 600, completed: false, type: 'work' }];
    } else if (kind === 'time') {
      sets = Array.from({ length: re.sets }, (_, i) => ({
        setNumber: i + 1,
        weightKg: 0,
        reps: 0,
        durationSec: re.durationSec ?? 30,
        completed: false,
        type: 'work' as const,
      }));
    } else {
      suggestion = suggestLoad(exerciseId === re.exerciseId ? re : { ...re, targetWeightKg: 0 }, lastPerformance(hist, exerciseId));
      const w = suggestion.weightKg || re.targetWeightKg || 0;
      const nWarm = re.warmupSets ?? 0;
      const warm: SetLog[] = Array.from({ length: nWarm }, (_, i) => ({
        setNumber: 0,
        // aquecimento progressivo: 40% → 70% da carga de trabalho
        weightKg: Math.round(w * (0.4 + (nWarm > 1 ? (0.3 * i) / (nWarm - 1) : 0)) * 2) / 2,
        reps: 12 - i * 2,
        completed: false,
        type: 'warmup',
      }));
      const work: SetLog[] = Array.from({ length: re.sets }, (_, i) => ({
        setNumber: i + 1,
        weightKg: w,
        reps: suggestion!.reps,
        completed: false,
        type: 'work',
      }));
      sets = [...warm, ...work];
    }
    return {
      exerciseId,
      exerciseName: nameOf(ex),
      muscleGroup: ex?.muscleGroup || 'chest',
      targetRestSeconds: re.restSeconds ?? ex?.defaultRestSeconds ?? 60,
      notes: re.notes,
      kind,
      technique,
      groupWithNext: !!re.groupWithNext,
      alternativeId: re.alternativeId,
      originalId: re.exerciseId,
      suggestion,
      sets,
    };
  };

  const startWorkoutFromRoutine = (
    routine: Routine,
    catalog: Exercise[] = exercisesCatalog,
    hist: WorkoutHistoryEntry[] = history
  ) => {
    setWorkoutExercises(routine.exercises.map((re) => buildExercise(re, re.exerciseId, catalog, hist)));
    setSelectedRoutine(routine);
    setIsWorkoutActive(true);
    setWorkoutStartTime(new Date());
    setElapsedSeconds(0);
  };

  const updateSet = (exIndex: number, setIndex: number, patch: Partial<SetLog>) =>
    setWorkoutExercises((prev) =>
      prev.map((ex, i) =>
        i !== exIndex ? ex : { ...ex, sets: ex.sets.map((s, j) => (j === setIndex ? { ...s, ...patch } : s)) }
      )
    );

  const startRest = (seconds: number) => {
    if (seconds <= 0) return;
    setCurrentRestDuration(seconds);
    setRestKey((k) => k + 1);
    setIsRestTimerOpen(true);
  };

  const handleToggleSet = (exIndex: number, setIndex: number) => {
    const ex = workoutExercises[exIndex];
    const set = ex.sets[setIndex];
    const done = !set.completed;
    updateSet(exIndex, setIndex, { completed: done });
    if (!done) return;
    if (navigator.vibrate) navigator.vibrate(30);
    // bi-set: emenda no próximo sem descanso; o descanso vem depois do último do grupo
    if (ex.groupWithNext || set.type === 'warmup') {
      if (set.type === 'warmup') startRest(Math.min(45, ex.targetRestSeconds));
      return;
    }
    if (ex.technique === 'restpause' && set.type === 'work') {
      const workIdx = ex.sets.filter((s) => s.type !== 'warmup');
      if (workIdx[workIdx.length - 1] === set) return startRest(15);
    }
    if (ex.kind === 'cardio') return;
    startRest(ex.targetRestSeconds || 60);
  };

  const handleAddSet = (exIndex: number, type: SetLog['type'] = 'work') =>
    setWorkoutExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIndex) return ex;
        const last = [...ex.sets].reverse().find((s) => s.type !== 'warmup') ?? ex.sets[ex.sets.length - 1];
        const workCount = ex.sets.filter((s) => s.type === 'work').length;
        const next: SetLog = {
          setNumber: type === 'work' ? workCount + 1 : 0,
          weightKg: last ? (type === 'drop' ? Math.round(last.weightKg * 0.8 * 2) / 2 : last.weightKg) : 20,
          reps: last ? last.reps : 10,
          durationSec: last?.durationSec,
          completed: false,
          type,
        };
        return { ...ex, sets: [...ex.sets, next] };
      })
    );

  const handleRemoveSet = (exIndex: number) =>
    setWorkoutExercises((prev) =>
      prev.map((ex, i) => (i !== exIndex || ex.sets.length <= 1 ? ex : { ...ex, sets: ex.sets.slice(0, -1) }))
    );

  const swapExercise = (exIndex: number, newId: string) => {
    const current = workoutExercises[exIndex];
    const re =
      selectedRoutine?.exercises.find((r) => r.exerciseId === current.originalId) ??
      ({
        id: 'tmp',
        exerciseId: current.originalId,
        sets: current.sets.filter((s) => s.type === 'work').length || 3,
        reps: String(current.sets.find((s) => s.type === 'work')?.reps ?? 10),
        targetWeightKg: 0,
        restSeconds: current.targetRestSeconds,
      } as RoutineExercise);
    const next = buildExercise(re, newId, exercisesCatalog, history);
    setWorkoutExercises((prev) => prev.map((e, i) => (i === exIndex ? next : e)));
    showToast(px.swapped(next.exerciseName));
  };

  const handleFinishWorkout = async () => {
    if (!student || !workoutStartTime) return;
    const allSets = workoutExercises.flatMap((e) => e.sets);
    const completedSets = allSets.filter((s) => s.completed && s.type !== 'warmup');
    const muscles = Array.from(new Set(workoutExercises.map((e) => e.muscleGroup)));
    const payload: Omit<WorkoutHistoryEntry, 'id'> = {
      studentId: student.id,
      routineId: selectedRoutine?.id,
      routineName: selectedRoutine?.name || t('workout.customWorkoutName'),
      startedAt: workoutStartTime.toISOString(),
      completedAt: new Date().toISOString(),
      durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
      totalVolumeKg: calculateTotalVolume(allSets),
      totalSets: completedSets.length,
      muscleGroups: muscles.length ? muscles : (selectedRoutine?.targetMuscleGroups ?? ['chest']),
      exercises: workoutExercises.map((e) => ({ exerciseId: e.exerciseId, exerciseName: e.exerciseName, sets: e.sets })),
    };
    const savedEntry = await finishWorkoutSafe(payload);
    saveActiveWorkout(null);
    setIsWorkoutActive(false);
    setIsRestTimerOpen(false);
    if ((savedEntry as { pending?: boolean }).pending) showToast(px.offline, 'warn');
    setCompletedWorkoutSummary(savedEntry);
    setIsCelebrationOpen(true);
  };

  const handleCancelWorkout = () => {
    if (confirm(t('workout.cancelWorkoutConfirm'))) {
      saveActiveWorkout(null);
      setIsWorkoutActive(false);
      setIsRestTimerOpen(false);
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const allSets = workoutExercises.flatMap((e) => e.sets);
  const totalVolumeLifted = calculateTotalVolume(allSets);
  const completedSetsCount = allSets.filter((s) => s.completed).length;
  const totalSetsCount = allSets.length;
  const altName = (id?: string) => (id ? nameOf(exercisesCatalog.find((e) => e.id === id)) : '');

  const suggestionText = (s?: LoadSuggestion) => {
    if (!s) return null;
    switch (s.reason) {
      case 'up':
        return px.sugUp(kg(s.deltaKg), s.lastReps ?? 0);
      case 'hold':
        return px.sugHold;
      case 'repsUp':
        return px.sugReps(s.reps);
      case 'keep':
        return px.sugKeep;
      default:
        return s.weightKg ? px.sugFirst : null;
    }
  };

  return (
    <div className="space-y-6 pb-48 animate-fadeIn">
      <RestTimer
        key={restKey}
        isOpen={isRestTimerOpen}
        initialSeconds={currentRestDuration}
        onFinish={() => setIsRestTimerOpen(false)}
        onSkip={() => setIsRestTimerOpen(false)}
      />

      <WorkoutCelebrationModal
        isOpen={isCelebrationOpen}
        workout={completedWorkoutSummary}
        onClose={() => {
          setIsCelebrationOpen(false);
          onFinishWorkoutSuccess();
        }}
      />

      {!isWorkoutActive ? (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">{t('workout.selectWorkoutToStart')}</h2>
            <p className="text-xs text-slate-400 mt-1">{px.selectHint}</p>
          </div>

          <div className="space-y-3">
            {availableRoutines.map((routine) => {
              const isSelected = selectedRoutine?.id === routine.id;
              return (
                <div
                  key={routine.id}
                  onClick={() => setSelectedRoutine(routine)}
                  className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-brand-primary shadow-xl ring-1 ring-brand-primary'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                      {t('teacher.division')} {routine.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      {routine.exercises.length} {language === 'es-PY' ? 'ejercicios' : 'exercícios'}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-black text-white">{routine.name}</h3>
                      {routine.description && <p className="text-xs text-slate-400 mt-1">{routine.description}</p>}
                    </div>
                    <div className="shrink-0 -my-1">
                      <RoutineMiniMap routine={routine} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {routine.targetMuscleGroups.map((mg) => (
                      <span key={mg} className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-950 text-slate-300 capitalize">
                        {t(`muscles.${mg}`)}
                      </span>
                    ))}
                  </div>
                  {isSelected && (
                    <button
                      type="button"
                      onClick={() => startWorkoutFromRoutine(routine)}
                      className="w-full mt-4 py-3.5 px-4 rounded-2xl bg-brand-primary hover:brightness-110 active:scale-[0.98] font-black text-white text-sm shadow-lg flex items-center justify-center gap-2 transition"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{t('home.startWorkoutButton')}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Barra do treino */}
          <div className="sticky top-14 z-20 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-3xl p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                    {selectedRoutine?.name || t('workout.title')}
                  </span>
                  <div className="text-xl font-mono font-black text-white leading-tight">{formatTimer(elapsedSeconds)}</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-white block">{formatWeight(totalVolumeLifted)}</span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {completedSetsCount}/{totalSetsCount} {t('common.sets')}
                </span>
              </div>
            </div>
            <div className="mt-2 h-1 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-brand-primary transition-all"
                style={{ width: `${totalSetsCount ? (completedSetsCount / totalSetsCount) * 100 : 0}%` }}
              />
            </div>
            {(wakeLock || !online) && (
              <div className="mt-2 flex items-center gap-3 text-[10px] font-semibold">
                {wakeLock && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <Sun className="w-3 h-3" />
                    {px.screenOn}
                  </span>
                )}
                {!online && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <WifiOff className="w-3 h-3" />
                    {px.offline}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Exercícios */}
          <div className="space-y-4">
            {workoutExercises.map((ex, exIndex) => {
              const inGroup = ex.groupWithNext || (exIndex > 0 && workoutExercises[exIndex - 1].groupWithNext);
              const groupStart = ex.groupWithNext && !(exIndex > 0 && workoutExercises[exIndex - 1].groupWithNext);
              let groupSize = 0;
              if (groupStart) for (let i = exIndex; i < workoutExercises.length; i++) {
                groupSize++;
                if (!workoutExercises[i].groupWithNext) break;
              }
              const sug = suggestionText(ex.suggestion);
              const workSets = ex.sets.filter((s) => s.type !== 'warmup');
              return (
                <div key={`${exIndex}-${ex.exerciseId}`} className={inGroup ? 'relative pl-3' : ''} data-testid="workout-exercise">
                  {inGroup && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-brand-primary/60" aria-hidden="true" />}
                  {groupStart && (
                    <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-brand-primary">
                      <Link2 className="w-3.5 h-3.5" />
                      {groupSize >= 3 ? px.triset : px.biset}
                    </div>
                  )}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                          {t('workout.exerciseIndex', { current: exIndex + 1, total: workoutExercises.length })}
                        </span>
                        <button type="button" onClick={() => setGuideExerciseId(ex.exerciseId)} className="text-left group">
                          <h3 className="text-base font-extrabold text-white mt-0.5 group-hover:text-brand-primary transition">
                            {ex.exerciseName}
                          </h3>
                          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-brand-primary">
                            <PlayCircle className="w-3.5 h-3.5" />
                            {gx.guide.open}
                          </span>
                        </button>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 capitalize">
                          {t(`muscles.${ex.muscleGroup}`)}
                        </span>
                        {ex.technique !== 'normal' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            {px.tech[ex.technique]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sugestão de carga */}
                    {ex.kind === 'reps' && ex.suggestion && sug && (
                      <div className="rounded-2xl bg-brand-primary-subtle border border-brand-primary/25 px-3 py-2 mb-3" data-testid="load-suggestion">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-brand-primary">
                          {ex.suggestion.reason === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                          {px.suggestion}: {kg(ex.suggestion.weightKg)} kg × {ex.suggestion.reps}
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">{sug}</div>
                        {ex.suggestion.lastWeightKg !== undefined && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {px.lastTime(kg(ex.suggestion.lastWeightKg), ex.suggestion.lastReps ?? 0)}
                          </div>
                        )}
                      </div>
                    )}

                    {ex.notes && (
                      <p className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 mb-3">💡 {ex.notes}</p>
                    )}
                    {ex.technique === 'dropset' && <p className="text-[11px] text-amber-300/90 mb-2">{px.dropHint}</p>}
                    {ex.technique === 'restpause' && <p className="text-[11px] text-amber-300/90 mb-2">{px.restPauseHint}</p>}
                    {ex.groupWithNext && workoutExercises[exIndex + 1] && (
                      <p className="text-[11px] text-brand-primary mb-2 flex items-center gap-1">
                        <Link2 className="w-3 h-3" />
                        {px.biHint(workoutExercises[exIndex + 1].exerciseName)}
                      </p>
                    )}

                    {/* Cabeçalho das séries */}
                    {ex.kind !== 'cardio' && (
                      <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                        <div className="col-span-2 text-center">{t('workout.setNumber')}</div>
                        <div className="col-span-4 text-center">{ex.kind === 'time' ? '—' : t('workout.weightCol')}</div>
                        <div className="col-span-3 text-center">{ex.kind === 'time' ? px.seconds : t('workout.repsCol')}</div>
                        <div className="col-span-3 text-center">{t('workout.doneCol')}</div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {ex.sets.map((set, setIndex) =>
                        ex.kind === 'cardio' ? (
                          <CardioRow
                            key={setIndex}
                            set={set}
                            minLabel={px.minutes}
                            onChange={(p) => updateSet(exIndex, setIndex, p)}
                            onToggle={() => handleToggleSet(exIndex, setIndex)}
                          />
                        ) : (
                          <SetRow
                            key={setIndex}
                            set={set}
                            kind={ex.kind}
                            label={set.type === 'warmup' ? px.warmupSet : set.type === 'drop' ? px.dropSet : String(set.setNumber)}
                            startLabel={px.startTimer}
                            onChange={(p) => updateSet(exIndex, setIndex, p)}
                            onToggle={() => handleToggleSet(exIndex, setIndex)}
                          />
                        )
                      )}
                    </div>

                    {/* Ações do exercício */}
                    <div className="flex items-center justify-between flex-wrap gap-1 mt-3 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-1">
                        {ex.kind !== 'cardio' && (
                          <button
                            type="button"
                            onClick={() => handleAddSet(exIndex)}
                            className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white py-1 px-2 rounded-lg hover:bg-slate-800 transition"
                          >
                            <Plus className="w-3.5 h-3.5 text-brand-primary" />
                            <span>{t('workout.addSet')}</span>
                          </button>
                        )}
                        {ex.technique === 'dropset' && (
                          <button
                            type="button"
                            onClick={() => handleAddSet(exIndex, 'drop')}
                            className="flex items-center gap-1 text-xs font-bold text-amber-300 py-1 px-2 rounded-lg hover:bg-slate-800 transition"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>+ {px.dropSet}</span>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {ex.kind !== 'cardio' && workSets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSet(exIndex)}
                            className="text-xs text-slate-500 hover:text-red-400 py-1 px-2 rounded-lg hover:bg-slate-800 transition"
                          >
                            {t('workout.removeSet')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSwapIndex(exIndex)}
                          className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white py-1 px-2 rounded-lg hover:bg-slate-800 transition"
                        >
                          <Repeat className="w-3.5 h-3.5 text-brand-primary" />
                          <span>{px.swap}</span>
                        </button>
                      </div>
                    </div>
                    {ex.alternativeId && ex.alternativeId !== ex.exerciseId && !ex.sets.some((s) => s.completed) && (
                      <button
                        type="button"
                        onClick={() => swapExercise(exIndex, ex.alternativeId!)}
                        className="mt-2 w-full text-left text-[11px] font-semibold text-slate-300 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2"
                      >
                        <span className="text-slate-500">{px.swapBusy} </span>
                        <span className="text-brand-primary">{px.swapTo(altName(ex.alternativeId))}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 space-y-3">
            <button
              type="button"
              onClick={handleFinishWorkout}
              className="w-full py-4 px-6 rounded-2xl bg-brand-primary hover:brightness-110 active:scale-[0.98] font-black text-white text-base tracking-wider shadow-2xl flex items-center justify-center gap-2 transition"
            >
              <Flag className="w-5 h-5" />
              <span>{t('workout.finishWorkout')}</span>
            </button>
            <button
              type="button"
              onClick={handleCancelWorkout}
              className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-300 transition"
            >
              {t('workout.cancelWorkout')}
            </button>
          </div>
        </div>
      )}

      {swapIndex !== null && workoutExercises[swapIndex] && (
        <ExercisePicker
          open
          onClose={() => setSwapIndex(null)}
          value={workoutExercises[swapIndex].exerciseId}
          exercises={exercisesCatalog}
          initialMuscle={workoutExercises[swapIndex].muscleGroup}
          onChange={(id) => {
            swapExercise(swapIndex, id);
            setSwapIndex(null);
          }}
        />
      )}
      <ExerciseGuideSheet exercise={guideExercise} onClose={() => setGuideExerciseId(null)} />
      {toast}
    </div>
  );
};

const RoutineMiniMap: React.FC<{ routine: Routine }> = ({ routine }) => {
  const muscles = useRoutineMuscles(routine);
  return <BodyMap levels={levelsFromMuscles(muscles)} height={64} />;
};

// ------------------------------------------------------------------ linhas de série

const SetRow: React.FC<{
  set: SetLog;
  kind: 'reps' | 'time';
  label: string;
  startLabel: string;
  onChange: (p: Partial<SetLog>) => void;
  onToggle: () => void;
}> = ({ set, kind, label, startLabel, onChange, onToggle }) => {
  const isDone = set.completed;
  const warm = set.type === 'warmup';
  const [left, setLeft] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => void (timer.current && clearInterval(timer.current)), []);

  const startCountdown = () => {
    const total = set.durationSec ?? 30;
    setLeft(total);
    const end = Date.now() + total * 1000;
    timer.current = setInterval(() => {
      const rem = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setLeft(rem);
      if (rem <= 0) {
        clearInterval(timer.current!);
        timer.current = null;
        setLeft(null);
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        onToggle();
      }
    }, 250);
  };

  return (
    <div
      className={`grid grid-cols-12 gap-2 items-center p-2 rounded-2xl border transition-all ${
        isDone ? 'bg-emerald-500/10 border-emerald-500/30' : warm ? 'bg-slate-950/50 border-slate-800 border-dashed' : 'bg-slate-950 border-slate-800'
      }`}
      data-set-type={set.type ?? 'work'}
    >
      <div className={`col-span-2 text-center font-bold ${warm || set.type === 'drop' ? 'text-[9px] uppercase text-amber-300' : 'text-xs text-slate-300'}`}>
        {label}
      </div>
      <div className="col-span-4">
        {kind === 'time' ? (
          <div className="text-center text-slate-600 text-xs">—</div>
        ) : (
          <div className="flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5">
            <input
              type="number"
              inputMode="decimal"
              aria-label="kg"
              value={set.weightKg}
              onChange={(e) => onChange({ weightKg: Math.max(0, parseFloat(e.target.value) || 0) })}
              className="w-full bg-transparent text-center font-black text-sm text-white focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 font-bold ml-1">kg</span>
          </div>
        )}
      </div>
      <div className="col-span-3">
        <div className="flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5">
          {kind === 'time' && left !== null ? (
            <span className="font-black text-sm text-brand-primary tabular-nums">{left}</span>
          ) : (
            <input
              type="number"
              inputMode="numeric"
              aria-label={kind === 'time' ? 's' : 'reps'}
              value={kind === 'time' ? set.durationSec ?? 30 : set.reps}
              onChange={(e) =>
                kind === 'time'
                  ? onChange({ durationSec: Math.max(1, parseInt(e.target.value) || 1) })
                  : onChange({ reps: Math.max(0, parseInt(e.target.value) || 0) })
              }
              className="w-full bg-transparent text-center font-black text-sm text-white focus:outline-none"
            />
          )}
        </div>
      </div>
      <div className="col-span-3 flex justify-center">
        {kind === 'time' && !isDone && left === null ? (
          <button
            type="button"
            onClick={startCountdown}
            aria-label={startLabel}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-primary text-white shadow-md active:scale-90"
          >
            <Timer className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (timer.current) {
                clearInterval(timer.current);
                timer.current = null;
                setLeft(null);
              }
              onToggle();
            }}
            aria-label={`${label} ✓`}
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all shadow-md active:scale-90 ${
              isDone ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
            }`}
          >
            <Check className="w-5 h-5 stroke-[3]" />
          </button>
        )}
      </div>
    </div>
  );
};

const CardioRow: React.FC<{
  set: SetLog;
  minLabel: string;
  onChange: (p: Partial<SetLog>) => void;
  onToggle: () => void;
}> = ({ set, minLabel, onChange, onToggle }) => (
  <div
    className={`flex items-center gap-3 p-2.5 rounded-2xl border ${
      set.completed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-950 border-slate-800'
    }`}
  >
    <Timer className="w-5 h-5 text-sky-400 shrink-0" />
    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 w-28">
      <input
        type="number"
        inputMode="numeric"
        aria-label={minLabel}
        value={Math.round((set.durationSec ?? 0) / 60)}
        onChange={(e) => onChange({ durationSec: Math.max(1, parseInt(e.target.value) || 1) * 60 })}
        className="w-full bg-transparent text-center font-black text-sm text-white focus:outline-none"
      />
      <span className="text-[10px] text-slate-500 font-bold ml-1">min</span>
    </div>
    <span className="flex-1" />
    <button
      type="button"
      onClick={onToggle}
      aria-label={`${minLabel} ✓`}
      className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md active:scale-90 ${
        set.completed ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'
      }`}
    >
      <Check className="w-5 h-5 stroke-[3]" />
    </button>
  </div>
);
