import React, { useState, useEffect } from 'react';
import {
  Play,
  Check,
  Plus,
  Trash2,
  Clock,
  Dumbbell,
  AlertCircle,
  Flag,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useBrand } from '../../context/BrandContext';
import { api } from '../../services/api';
import {
  Routine,
  Exercise,
  SetLog,
  WorkoutHistoryEntry,
  Student,
} from '../../types';
import { calculateTotalVolume } from '../../utils/rules';
import { RestTimer } from '../../components/workout/RestTimer';
import { WorkoutCelebrationModal } from '../../components/workout/WorkoutCelebrationModal';

interface WorkoutViewProps {
  initialRoutine?: Routine | null;
  onFinishWorkoutSuccess: () => void;
}

interface ActiveExerciseState {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  targetRestSeconds: number;
  previousWeightKg?: number;
  notes?: string;
  sets: {
    setNumber: number;
    weightKg: number;
    reps: number;
    completed: boolean;
  }[];
}

export const WorkoutView: React.FC<WorkoutViewProps> = ({
  initialRoutine,
  onFinishWorkoutSuccess,
}) => {
  const { currentUser } = useAuth();
  const { language, t, formatWeight } = useLanguage();
  const { brand } = useBrand();

  const student = currentUser as Student;

  const [availableRoutines, setAvailableRoutines] = useState<Routine[]>([]);
  const [exercisesCatalog, setExercisesCatalog] = useState<Exercise[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(initialRoutine || null);

  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Active workout exercises state
  const [workoutExercises, setWorkoutExercises] = useState<ActiveExerciseState[]>([]);

  // Rest Timer State
  const [isRestTimerOpen, setIsRestTimerOpen] = useState(false);
  const [currentRestDuration, setCurrentRestDuration] = useState(60);

  // Finished Celebration Modal State
  const [completedWorkoutSummary, setCompletedWorkoutSummary] = useState<WorkoutHistoryEntry | null>(
    null
  );
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);

  // Load available routines and exercises
  useEffect(() => {
    async function initData() {
      if (!student) return;
      const routines = await api.getRoutines(student.id);
      const allRoutines = routines.length > 0 ? routines : await api.getRoutines();
      setAvailableRoutines(allRoutines);

      const exercises = await api.getExercises();
      setExercisesCatalog(exercises);

      if (initialRoutine) {
        startWorkoutFromRoutine(initialRoutine, exercises);
      } else if (allRoutines.length > 0 && !isWorkoutActive) {
        setSelectedRoutine(allRoutines[0]);
      }
    }
    initData();
  }, [student, initialRoutine]);

  // Workout duration timer tick
  useEffect(() => {
    if (!isWorkoutActive) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isWorkoutActive]);

  const startWorkoutFromRoutine = (routine: Routine, catalog: Exercise[] = exercisesCatalog) => {
    const list: ActiveExerciseState[] = routine.exercises.map((re) => {
      const ex = catalog.find((e) => e.id === re.exerciseId);
      const name = ex ? ex.name[language] || ex.name['pt-BR'] : 'Exercício';
      const parsedReps = parseInt(re.reps) || 10;
      const targetWeight = re.targetWeightKg || re.previousWeightKg || 20;

      const sets: SetLog[] = Array.from({ length: re.sets }).map((_, idx) => ({
        setNumber: idx + 1,
        weightKg: targetWeight,
        reps: parsedReps,
        completed: false,
      }));

      return {
        exerciseId: re.exerciseId,
        exerciseName: name,
        muscleGroup: ex?.muscleGroup || 'chest',
        targetRestSeconds: re.restSeconds || ex?.defaultRestSeconds || 60,
        previousWeightKg: re.previousWeightKg || targetWeight,
        notes: re.notes,
        sets,
      };
    });

    setWorkoutExercises(list);
    setSelectedRoutine(routine);
    setIsWorkoutActive(true);
    setWorkoutStartTime(new Date());
    setElapsedSeconds(0);
  };

  const handleToggleSet = (exIndex: number, setIndex: number) => {
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exIndex] };
      const sets = [...ex.sets];
      const currentSet = { ...sets[setIndex] };

      currentSet.completed = !currentSet.completed;
      sets[setIndex] = currentSet;
      ex.sets = sets;
      updated[exIndex] = ex;

      // When set is marked as completed, trigger automatic rest timer
      if (currentSet.completed) {
        setCurrentRestDuration(ex.targetRestSeconds || 60);
        setIsRestTimerOpen(true);
      }

      return updated;
    });
  };

  const handleUpdateSetWeight = (exIndex: number, setIndex: number, weight: number) => {
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exIndex] };
      const sets = [...ex.sets];
      sets[setIndex] = { ...sets[setIndex], weightKg: Math.max(0, weight) };
      ex.sets = sets;
      updated[exIndex] = ex;
      return updated;
    });
  };

  const handleUpdateSetReps = (exIndex: number, setIndex: number, reps: number) => {
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exIndex] };
      const sets = [...ex.sets];
      sets[setIndex] = { ...sets[setIndex], reps: Math.max(1, reps) };
      ex.sets = sets;
      updated[exIndex] = ex;
      return updated;
    });
  };

  const handleAddSet = (exIndex: number) => {
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exIndex] };
      const lastSet = ex.sets[ex.sets.length - 1];
      const newSet: SetLog = {
        setNumber: ex.sets.length + 1,
        weightKg: lastSet ? lastSet.weightKg : 20,
        reps: lastSet ? lastSet.reps : 10,
        completed: false,
      };
      ex.sets = [...ex.sets, newSet];
      updated[exIndex] = ex;
      return updated;
    });
  };

  const handleRemoveSet = (exIndex: number) => {
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exIndex] };
      if (ex.sets.length <= 1) return prev;
      ex.sets = ex.sets.slice(0, -1);
      updated[exIndex] = ex;
      return updated;
    });
  };

  const handleFinishWorkout = async () => {
    if (!student || !workoutStartTime) return;

    // Collect all sets
    const allSets = workoutExercises.flatMap((e) => e.sets);
    const completedSets = allSets.filter((s) => s.completed);

    const totalVolume = calculateTotalVolume(allSets);
    const durationMin = Math.max(1, Math.round(elapsedSeconds / 60));

    const workoutPayload: Omit<WorkoutHistoryEntry, 'id'> = {
      studentId: student.id,
      routineId: selectedRoutine?.id,
      routineName: selectedRoutine?.name || t('workout.customWorkoutName'),
      startedAt: workoutStartTime.toISOString(),
      completedAt: new Date().toISOString(),
      durationMinutes: durationMin,
      totalVolumeKg: totalVolume,
      totalSets: completedSets.length,
      muscleGroups: (selectedRoutine?.targetMuscleGroups as any) || ['chest'],
      exercises: workoutExercises.map((e) => ({
        exerciseId: e.exerciseId,
        exerciseName: e.exerciseName,
        sets: e.sets,
      })),
    };

    const savedEntry = await api.finishWorkout(workoutPayload);

    // Stop active workout
    setIsWorkoutActive(false);
    setIsRestTimerOpen(false);

    // Show celebration modal
    setCompletedWorkoutSummary(savedEntry);
    setIsCelebrationOpen(true);
  };

  const handleCancelWorkout = () => {
    if (confirm(t('workout.cancelWorkoutConfirm'))) {
      setIsWorkoutActive(false);
      setIsRestTimerOpen(false);
    }
  };

  // Format elapsed time (MM:SS)
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Current session stats
  const totalVolumeLifted = calculateTotalVolume(workoutExercises.flatMap((e) => e.sets));
  const completedSetsCount = workoutExercises.flatMap((e) => e.sets).filter((s) => s.completed).length;
  const totalSetsCount = workoutExercises.flatMap((e) => e.sets).length;

  return (
    <div className="space-y-6 pb-48 animate-fadeIn">
      {/* REST TIMER (Floating automatic countdown) */}
      <RestTimer
        isOpen={isRestTimerOpen}
        initialSeconds={currentRestDuration}
        onFinish={() => setIsRestTimerOpen(false)}
        onSkip={() => setIsRestTimerOpen(false)}
      />

      {/* WORKOUT CELEBRATION MODAL */}
      <WorkoutCelebrationModal
        isOpen={isCelebrationOpen}
        workout={completedWorkoutSummary}
        onClose={() => {
          setIsCelebrationOpen(false);
          onFinishWorkoutSuccess();
        }}
      />

      {!isWorkoutActive ? (
        /* SCREEN 1: SELECT ROUTINE TO START */
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              {t('workout.selectWorkoutToStart')}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Escolha a ficha prescrita pelo seu professor ou inicie o treino do dia.
            </p>
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
                      Ficha {routine.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      {routine.exercises.length} exercícios
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white">{routine.name}</h3>

                  {routine.description && (
                    <p className="text-xs text-slate-400 mt-1">{routine.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {routine.targetMuscleGroups.map((mg) => (
                      <span
                        key={mg}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-950 text-slate-300 capitalize"
                      >
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
        /* SCREEN 2: ACTIVE LIVE WORKOUT EXECUTION */
        <div className="space-y-5">
          {/* Top Live Session Bar */}
          <div className="sticky top-14 z-20 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-3xl p-4 shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  {selectedRoutine?.name || t('workout.title')}
                </span>
                <div className="text-xl font-mono font-black text-white leading-tight">
                  {formatTimer(elapsedSeconds)}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-white block">
                {formatWeight(totalVolumeLifted)}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">
                {completedSetsCount}/{totalSetsCount} {t('common.sets')}
              </span>
            </div>
          </div>

          {/* Exercises List */}
          <div className="space-y-4">
            {workoutExercises.map((ex, exIndex) => (
              <div
                key={ex.exerciseId}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl"
              >
                {/* Exercise Header */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      {t('workout.exerciseIndex', { current: exIndex + 1, total: workoutExercises.length })}
                    </span>
                    <h3 className="text-base font-extrabold text-white mt-0.5">
                      {ex.exerciseName}
                    </h3>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 capitalize">
                    {t(`muscles.${ex.muscleGroup as any}`)}
                  </span>
                </div>

                {/* Previous load helper */}
                {ex.previousWeightKg !== undefined && (
                  <div className="text-xs text-brand-primary font-semibold flex items-center gap-1.5 mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {t('workout.previousLoad', { weight: String(ex.previousWeightKg), reps: '10' })}
                    </span>
                  </div>
                )}

                {ex.notes && (
                  <p className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 mb-3">
                    💡 {ex.notes}
                  </p>
                )}

                {/* Sets Table Header */}
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                  <div className="col-span-2 text-center">{t('workout.setNumber')}</div>
                  <div className="col-span-4 text-center">{t('workout.weightCol')}</div>
                  <div className="col-span-3 text-center">{t('workout.repsCol')}</div>
                  <div className="col-span-3 text-center">{t('workout.doneCol')}</div>
                </div>

                {/* Sets Rows */}
                <div className="space-y-2">
                  {ex.sets.map((set, setIndex) => {
                    const isDone = set.completed;
                    return (
                      <div
                        key={set.setNumber}
                        className={`grid grid-cols-12 gap-2 items-center p-2 rounded-2xl border transition-all ${
                          isDone
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        {/* Set index */}
                        <div className="col-span-2 text-center font-bold text-xs text-slate-300">
                          {set.setNumber}
                        </div>

                        {/* Weight Input (large touch friendly) */}
                        <div className="col-span-4">
                          <div className="flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5">
                            <input
                              type="number"
                              inputMode="decimal"
                              value={set.weightKg}
                              onChange={(e) =>
                                handleUpdateSetWeight(exIndex, setIndex, parseFloat(e.target.value) || 0)
                              }
                              className="w-full bg-transparent text-center font-black text-sm text-white focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-500 font-bold ml-1">kg</span>
                          </div>
                        </div>

                        {/* Reps Input */}
                        <div className="col-span-3">
                          <div className="flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5">
                            <input
                              type="number"
                              inputMode="numeric"
                              value={set.reps}
                              onChange={(e) =>
                                handleUpdateSetReps(exIndex, setIndex, parseInt(e.target.value) || 0)
                              }
                              className="w-full bg-transparent text-center font-black text-sm text-white focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Checkbox button (Extra-large touch target for gym one-handed use) */}
                        <div className="col-span-3 flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSet(exIndex, setIndex)}
                            aria-label={`Concluir série ${set.setNumber}`}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all shadow-md active:scale-90 ${
                              isDone
                                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                            }`}
                          >
                            <Check className="w-5 h-5 stroke-[3]" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add / Remove Set Row */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleAddSet(exIndex)}
                    className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white py-1 px-2.5 rounded-lg hover:bg-slate-800 transition"
                  >
                    <Plus className="w-3.5 h-3.5 text-brand-primary" />
                    <span>{t('workout.addSet')}</span>
                  </button>

                  {ex.sets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSet(exIndex)}
                      className="text-xs text-slate-500 hover:text-red-400 py-1 px-2.5 rounded-lg hover:bg-slate-800 transition"
                    >
                      {t('workout.removeSet')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Actions: Finish Workout (Large Hero Button) & Cancel */}
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
    </div>
  );
};
