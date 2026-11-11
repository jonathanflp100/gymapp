import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseRepRange, suggestLoad, lastPerformance } from './progression';
import type { RoutineExercise, WorkoutHistoryEntry } from '../types';

const re = (o: Partial<RoutineExercise>): RoutineExercise => ({
  id: 'r', exerciseId: 'ex-a', sets: 3, reps: '8-12', targetWeightKg: 40, restSeconds: 60, ...o,
});
const hist = (sets: [number, number][], type?: 'warmup'): WorkoutHistoryEntry[] => [{
  id: 'h', studentId: 's', routineName: 'A', startedAt: '2026-11-01T10:00:00Z', completedAt: '2026-11-01T11:00:00Z',
  durationMinutes: 60, totalVolumeKg: 0, totalSets: 3, muscleGroups: [],
  exercises: [{ exerciseId: 'ex-a', exerciseName: 'A', sets: [
    { setNumber: 0, weightKg: 20, reps: 12, completed: true, type: 'warmup' },
    ...sets.map(([w, r], i) => ({ setNumber: i + 1, weightKg: w, reps: r, completed: true, type })),
  ] }],
}];

const like = (a: object, b: Record<string, unknown>) => {
  for (const [k, v] of Object.entries(b)) assert.equal((a as Record<string, unknown>)[k], v, k);
};

describe('progressão de carga', () => {
  it('lê a faixa de reps', () => {
    assert.deepEqual(parseRepRange('8-12'), { min: 8, max: 12 });
    assert.deepEqual(parseRepRange('10'), { min: 10, max: 10 });
    assert.deepEqual(parseRepRange('12 a 8'), { min: 8, max: 12 });
  });
  it('primeira vez usa a carga da ficha', () => {
    like(suggestLoad(re({}), null), { weightKg: 40, reason: 'first' });
  });
  it('ignora aquecimento', () => {
    assert.equal(lastPerformance(hist([[50, 10]]), 'ex-a')?.sets.length, 1);
  });
  it('linear sobe quando bate o mínimo', () => {
    const s = suggestLoad(re({ progression: 'linear', incrementKg: 2 }), lastPerformance(hist([[50, 9], [50, 8]]), 'ex-a'));
    like(s, { weightKg: 52, deltaKg: 2, reason: 'up' });
  });
  it('linear segura quando falha', () => {
    const s = suggestLoad(re({ progression: 'linear' }), lastPerformance(hist([[50, 9], [50, 6]]), 'ex-a'));
    like(s, { weightKg: 50, reason: 'hold' });
  });
  it('dupla sobe reps e depois carga', () => {
    const r = re({ progression: 'double' });
    like(suggestLoad(r, lastPerformance(hist([[50, 10], [50, 9]]), 'ex-a')), { weightKg: 50, reps: 10, reason: 'repsUp' });
    like(suggestLoad(r, lastPerformance(hist([[50, 12], [50, 12]]), 'ex-a')), { weightKg: 52.5, reps: 8, reason: 'up' });
  });
});
