/**
 * Sugestão de carga para a próxima sessão, a partir da última vez que o aluno fez o exercício.
 *  - linear: bateu o mínimo de reps em todas as séries → sobe a carga
 *  - double: sobe as reps até o topo da faixa; quando chega no topo em todas → sobe a carga e volta ao mínimo
 *  - none: repete a última carga
 */
import type { ProgressionRule, RoutineExercise, SetLog, WorkoutHistoryEntry } from '../types';

export function parseRepRange(reps: string): { min: number; max: number } {
  const nums = (reps.match(/\d+/g) ?? []).map(Number).filter((n) => n > 0);
  if (!nums.length) return { min: 10, max: 10 };
  if (nums.length === 1) return { min: nums[0], max: nums[0] };
  return { min: Math.min(nums[0], nums[1]), max: Math.max(nums[0], nums[1]) };
}

export interface LastPerformance {
  date: string;
  sets: SetLog[]; // só séries de trabalho concluídas
}

export function lastPerformance(history: WorkoutHistoryEntry[], exerciseId: string): LastPerformance | null {
  const sorted = [...history].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  for (const w of sorted) {
    const e = w.exercises.find((x) => x.exerciseId === exerciseId);
    if (!e) continue;
    const work = e.sets.filter((s) => s.completed && (s.type ?? 'work') === 'work' && s.weightKg > 0);
    if (work.length) return { date: w.startedAt, sets: work };
  }
  return null;
}

export type SuggestionReason = 'first' | 'up' | 'repsUp' | 'hold' | 'keep';

export interface LoadSuggestion {
  weightKg: number;
  reps: number;
  deltaKg: number;
  reason: SuggestionReason;
  lastWeightKg?: number;
  lastReps?: number;
}

const round = (n: number) => Math.round(n * 4) / 4; // múltiplos de 0,25 kg

export function suggestLoad(re: RoutineExercise, last: LastPerformance | null): LoadSuggestion {
  const { min, max } = parseRepRange(re.reps);
  const rule: ProgressionRule = re.progression ?? 'none';
  const inc = re.incrementKg && re.incrementKg > 0 ? re.incrementKg : 2.5;
  if (!last) {
    const w = re.targetWeightKg || re.previousWeightKg || 0;
    return { weightKg: w, reps: max, deltaKg: 0, reason: 'first' };
  }
  const lastW = Math.max(...last.sets.map((s) => s.weightKg));
  const atTop = last.sets.filter((s) => s.weightKg === lastW);
  const minReps = Math.min(...atTop.map((s) => s.reps));
  const base = { lastWeightKg: lastW, lastReps: minReps };

  if (rule === 'linear') {
    if (minReps >= min) return { ...base, weightKg: round(lastW + inc), reps: min, deltaKg: inc, reason: 'up' };
    return { ...base, weightKg: lastW, reps: min, deltaKg: 0, reason: 'hold' };
  }
  if (rule === 'double') {
    if (minReps >= max) return { ...base, weightKg: round(lastW + inc), reps: min, deltaKg: inc, reason: 'up' };
    return { ...base, weightKg: lastW, reps: Math.min(max, Math.max(min, minReps + 1)), deltaKg: 0, reason: 'repsUp' };
  }
  return { ...base, weightKg: lastW, reps: Math.max(min, Math.min(max, minReps)), deltaKg: 0, reason: 'keep' };
}
