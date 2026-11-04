import { SetLog, MuscleGroup, MuscleFatigueScore } from '../types';

/**
 * Calculates total volume in kg lifted in a workout or exercise
 */
export function calculateTotalVolume(sets: { weightKg: number; reps: number; completed?: boolean }[]): number {
  return sets.reduce((acc, set) => {
    if (set.completed === false) return acc;
    const weight = Number(set.weightKg) || 0;
    const reps = Number(set.reps) || 0;
    return acc + weight * reps;
  }, 0);
}

/**
 * Calculates estimated 1 Rep Max (1RM) using the standard Epley formula
 * 1RM = Weight * (1 + Reps / 30)
 */
export function calculateEpley1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return Math.round(weightKg);
  const estimate = weightKg * (1 + reps / 30);
  return Math.round(estimate * 10) / 10;
}

/**
 * Checks if a set qualifies as a new personal record against previous max
 */
export function isNewPersonalRecord(currentWeightKg: number, previousMaxWeightKg: number): boolean {
  return currentWeightKg > previousMaxWeightKg;
}

/**
 * Calculates consecutive active streak days ending on or near reference date
 */
export function calculateStreak(workoutDates: string[], referenceDate: Date = new Date()): number {
  if (!workoutDates || workoutDates.length === 0) return 0;

  // Format dates to YYYY-MM-DD in local time
  const dateSet = new Set(
    workoutDates.map((d) => {
      const dt = new Date(d);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    })
  );

  const getLocalDateStr = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  let checkDate = new Date(referenceDate);
  const todayStr = getLocalDateStr(checkDate);

  // If trained today, start counting from today; if not, check yesterday
  let streak = 0;
  if (dateSet.has(todayStr)) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = getLocalDateStr(checkDate);
    if (!dateSet.has(yesterdayStr)) {
      return 0; // Broke streak
    }
  }

  // Count backwards day by day
  while (true) {
    const curStr = getLocalDateStr(checkDate);
    if (dateSet.has(curStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculates muscle fatigue and stimulus level based on total weekly sets
 */
export function calculateMuscleIntensityLevel(setsCount: number): 'none' | 'light' | 'moderate' | 'high' {
  if (setsCount <= 0) return 'none';
  if (setsCount < 6) return 'light';
  if (setsCount <= 14) return 'moderate';
  return 'high';
}

/**
 * Aggregates muscle group volume and sets from workout history
 */
export function aggregateMuscleStimulus(
  workouts: { muscleGroups: MuscleGroup[]; exercises: { sets: SetLog[] }[] }[]
): Record<MuscleGroup, MuscleFatigueScore> {
  const allGroups: MuscleGroup[] = [
    'chest',
    'back',
    'shoulders',
    'biceps',
    'triceps',
    'quadriceps',
    'hamstrings',
    'glutes',
    'calves',
    'abs',
  ];

  const result: Record<MuscleGroup, MuscleFatigueScore> = {} as any;

  for (const group of allGroups) {
    result[group] = {
      muscleGroup: group,
      volumeKg: 0,
      setsCount: 0,
      intensity: 'none',
    };
  }

  for (const workout of workouts) {
    const totalWorkoutSets = workout.exercises.reduce(
      (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
      0
    );
    const totalWorkoutVol = workout.exercises.reduce(
      (sum, ex) => sum + calculateTotalVolume(ex.sets),
      0
    );

    const groupCount = Math.max(workout.muscleGroups.length, 1);
    const setsPerGroup = Math.round(totalWorkoutSets / groupCount);
    const volPerGroup = Math.round(totalWorkoutVol / groupCount);

    for (const group of workout.muscleGroups) {
      if (result[group]) {
        result[group].setsCount += setsPerGroup;
        result[group].volumeKg += volPerGroup;
      }
    }
  }

  for (const group of allGroups) {
    result[group].intensity = calculateMuscleIntensityLevel(result[group].setsCount);
  }

  return result;
}
