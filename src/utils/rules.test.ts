import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTotalVolume,
  calculateEpley1RM,
  isNewPersonalRecord,
  calculateStreak,
  calculateMuscleIntensityLevel,
  aggregateMuscleStimulus,
} from './rules';

test('calculateTotalVolume accurately sums completed sets', () => {
  const sets = [
    { weightKg: 80, reps: 10, completed: true },
    { weightKg: 80, reps: 8, completed: true },
    { weightKg: 90, reps: 5, completed: false }, // uncompleted
  ];
  // 80*10 + 80*8 = 800 + 640 = 1440
  assert.equal(calculateTotalVolume(sets), 1440);
});

test('calculateEpley1RM computes correct one rep max estimate', () => {
  // 100kg for 10 reps = 100 * (1 + 10/30) = 133.33 -> 133.3
  const estimate = calculateEpley1RM(100, 10);
  assert.equal(estimate, 133.3);

  // 1 rep should return original weight
  assert.equal(calculateEpley1RM(150, 1), 150);

  // 0 or negative
  assert.equal(calculateEpley1RM(0, 5), 0);
});

test('isNewPersonalRecord detects when a new PR is broken', () => {
  assert.equal(isNewPersonalRecord(105, 100), true);
  assert.equal(isNewPersonalRecord(100, 100), false);
  assert.equal(isNewPersonalRecord(95, 100), false);
});

test('calculateStreak counts consecutive training days', () => {
  const base = new Date('2026-11-04T12:00:00Z');
  const dates = [
    '2026-11-04T10:00:00Z',
    '2026-11-03T09:00:00Z',
    '2026-11-02T18:00:00Z',
  ];
  const streak = calculateStreak(dates, base);
  assert.equal(streak, 3);
});

test('calculateMuscleIntensityLevel maps sets to intensity categories', () => {
  assert.equal(calculateMuscleIntensityLevel(0), 'none');
  assert.equal(calculateMuscleIntensityLevel(4), 'light');
  assert.equal(calculateMuscleIntensityLevel(10), 'moderate');
  assert.equal(calculateMuscleIntensityLevel(16), 'high');
});
