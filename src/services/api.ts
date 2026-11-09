import {
  Student,
  Teacher,
  Exercise,
  Routine,
  WorkoutHistoryEntry,
  WeightRecord,
  PersonalRecord,
  MuscleGroup,
  MuscleFatigueScore,
} from '../types';
import {
  MOCK_STUDENTS,
  MOCK_TEACHERS,
  MOCK_EXERCISES,
  MOCK_ROUTINES,
  MOCK_HISTORY,
  MOCK_WEIGHT_RECORDS,
  MOCK_PERSONAL_RECORDS,
} from '../data/mockData';
import { localizeDemoData } from '../data/demoLocaleEs';
import { searchExercises, loadCatalogue, getCatalogueExercise, isCatalogueId } from './catalogue';
import { REAL_BACKEND, openGymApi } from './openGymBackend';
import { aggregateMuscleStimulus, isNewPersonalRecord, calculateEpley1RM } from '../utils/rules';

// Local storage keys to persist state across app interactions
const STORAGE_KEYS = {
  STUDENTS: 'gymapp_data_students',
  ROUTINES: 'gymapp_data_routines',
  EXERCISES: 'gymapp_data_exercises',
  HISTORY: 'gymapp_data_history',
  WEIGHTS: 'gymapp_data_weights',
  PRS: 'gymapp_data_prs',
};

// Safe initialization of local data
function getStoredData<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn(`Error reading ${key} from storage:`, err);
  }
  return fallback;
}

function setStoredData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Error writing ${key} to storage:`, err);
  }
}

// In-memory data store initialized from localStorage or mock defaults
let studentsStore: Student[] = getStoredData(STORAGE_KEYS.STUDENTS, MOCK_STUDENTS);
let teachersStore: Teacher[] = MOCK_TEACHERS;
let routinesStore: Routine[] = getStoredData(STORAGE_KEYS.ROUTINES, MOCK_ROUTINES);
let exercisesStore: Exercise[] = getStoredData(STORAGE_KEYS.EXERCISES, MOCK_EXERCISES);
let historyStore: WorkoutHistoryEntry[] = getStoredData(STORAGE_KEYS.HISTORY, MOCK_HISTORY);
let weightsStore: WeightRecord[] = getStoredData(STORAGE_KEYS.WEIGHTS, MOCK_WEIGHT_RECORDS);
let prsStore: PersonalRecord[] = getStoredData(STORAGE_KEYS.PRS, MOCK_PERSONAL_RECORDS);

// Simulates brief asynchronous roundtrip for architecture parity with real REST/GraphQL backends
const delay = (ms = 40) => new Promise((resolve) => setTimeout(resolve, ms));

export interface GymApiService {
  // Students
  getStudents(gymCode?: string): Promise<Student[]>;
  getStudentById(id: string): Promise<Student | null>;
  updateStudent(id: string, updates: Partial<Student>): Promise<Student>;

  // Teachers
  getTeachers(gymCode?: string): Promise<Teacher[]>;
  getTeacherById(id: string): Promise<Teacher | null>;

  // Routines / Workouts
  getRoutines(studentId?: string): Promise<Routine[]>;
  getRoutineById(id: string): Promise<Routine | null>;
  saveRoutine(routine: Omit<Routine, 'id' | 'updatedAt'> & { id?: string }): Promise<Routine>;
  deleteRoutine(id: string): Promise<boolean>;
  assignRoutine(routineId: string, studentIds: string[]): Promise<boolean>;

  // Exercises
  getExercises(filter?: { muscleGroup?: MuscleGroup; query?: string }): Promise<Exercise[]>;
  getExerciseById(id: string): Promise<Exercise | null>;
  createExercise(exerciseData: Omit<Exercise, 'id'>): Promise<Exercise>;

  // Workout Execution & History
  getWorkoutHistory(studentId: string): Promise<WorkoutHistoryEntry[]>;
  finishWorkout(workoutData: Omit<WorkoutHistoryEntry, 'id'>): Promise<WorkoutHistoryEntry>;

  // Evolution & Stats
  getWeightHistory(studentId: string): Promise<WeightRecord[]>;
  logWeight(studentId: string, weightKg: number): Promise<WeightRecord>;
  getPersonalRecords(studentId: string): Promise<PersonalRecord[]>;
  getWeeklyMuscleStimulus(studentId: string): Promise<Record<MuscleGroup, MuscleFatigueScore>>;

  // Data management
  resetToMocks(): Promise<void>;
}

const baseApi: GymApiService = {
  async getStudents(gymCode?: string): Promise<Student[]> {
    await delay();
    if (!gymCode) return [...studentsStore];
    return studentsStore.filter((s) => s.gymCode === gymCode);
  },

  async getStudentById(id: string): Promise<Student | null> {
    await delay();
    return studentsStore.find((s) => s.id === id) || null;
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    await delay();
    const index = studentsStore.findIndex((s) => s.id === id);
    if (index === -1) throw new Error(`Student ${id} not found`);
    studentsStore[index] = { ...studentsStore[index], ...updates };
    setStoredData(STORAGE_KEYS.STUDENTS, studentsStore);
    return studentsStore[index];
  },

  async getTeachers(gymCode?: string): Promise<Teacher[]> {
    await delay();
    if (!gymCode) return [...teachersStore];
    return teachersStore.filter((t) => t.gymCode === gymCode);
  },

  async getTeacherById(id: string): Promise<Teacher | null> {
    await delay();
    return teachersStore.find((t) => t.id === id) || null;
  },

  async getRoutines(studentId?: string): Promise<Routine[]> {
    await delay();
    if (!studentId) return [...routinesStore];
    return routinesStore.filter((r) => r.assignedStudentIds.includes(studentId));
  },

  async getRoutineById(id: string): Promise<Routine | null> {
    await delay();
    return routinesStore.find((r) => r.id === id) || null;
  },

  async saveRoutine(routineData: Omit<Routine, 'id' | 'updatedAt'> & { id?: string }): Promise<Routine> {
    await delay();
    const nowStr = new Date().toISOString().split('T')[0];
    if (routineData.id) {
      const idx = routinesStore.findIndex((r) => r.id === routineData.id);
      if (idx !== -1) {
        routinesStore[idx] = {
          ...routinesStore[idx],
          ...routineData,
          updatedAt: nowStr,
        } as Routine;
        setStoredData(STORAGE_KEYS.ROUTINES, routinesStore);
        return routinesStore[idx];
      }
    }

    const newRoutine: Routine = {
      ...routineData,
      id: routineData.id || `routine-${Date.now()}`,
      updatedAt: nowStr,
    };
    routinesStore.unshift(newRoutine);
    setStoredData(STORAGE_KEYS.ROUTINES, routinesStore);
    return newRoutine;
  },

  async deleteRoutine(id: string): Promise<boolean> {
    await delay();
    routinesStore = routinesStore.filter((r) => r.id !== id);
    setStoredData(STORAGE_KEYS.ROUTINES, routinesStore);
    return true;
  },

  async assignRoutine(routineId: string, studentIds: string[]): Promise<boolean> {
    await delay();
    const routine = routinesStore.find((r) => r.id === routineId);
    if (!routine) return false;

    routine.assignedStudentIds = Array.from(new Set([...routine.assignedStudentIds, ...studentIds]));
    setStoredData(STORAGE_KEYS.ROUTINES, routinesStore);

    // Also update student active routine
    for (const studentId of studentIds) {
      const sIdx = studentsStore.findIndex((s) => s.id === studentId);
      if (sIdx !== -1) {
        studentsStore[sIdx].activeRoutineId = routineId;
      }
    }
    setStoredData(STORAGE_KEYS.STUDENTS, studentsStore);
    return true;
  },

  async getExercises(filter?: { muscleGroup?: MuscleGroup; query?: string }): Promise<Exercise[]> {
    await delay();
    return searchExercises(exercisesStore, filter);
  },

  async getExerciseById(id: string): Promise<Exercise | null> {
    await delay();
    if (isCatalogueId(id)) {
      await loadCatalogue();
      return getCatalogueExercise(id);
    }
    return exercisesStore.find((e) => e.id === id) || null;
  },

  async createExercise(exerciseData: Omit<Exercise, 'id'>): Promise<Exercise> {
    await delay();
    const newExercise: Exercise = {
      ...exerciseData,
      id: `ex-custom-${Date.now()}`,
    };
    exercisesStore.unshift(newExercise);
    setStoredData(STORAGE_KEYS.EXERCISES, exercisesStore);
    return newExercise;
  },

  async getWorkoutHistory(studentId: string): Promise<WorkoutHistoryEntry[]> {
    await delay();
    return historyStore
      .filter((h) => h.studentId === studentId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  },

  async finishWorkout(workoutData: Omit<WorkoutHistoryEntry, 'id'>): Promise<WorkoutHistoryEntry> {
    await delay();
    const newEntry: WorkoutHistoryEntry = {
      ...workoutData,
      id: `hist-${Date.now()}`,
    };

    historyStore.unshift(newEntry);
    setStoredData(STORAGE_KEYS.HISTORY, historyStore);

    // Update student's streak and last workout date
    const studentIdx = studentsStore.findIndex((s) => s.id === workoutData.studentId);
    if (studentIdx !== -1) {
      const s = studentsStore[studentIdx];
      s.lastWorkoutDate = new Date().toISOString().split('T')[0];
      s.currentStreakDays = (s.currentStreakDays || 0) + 1;
      setStoredData(STORAGE_KEYS.STUDENTS, studentsStore);
    }

    // Check and record PRs
    const brokenPRs: string[] = [];
    for (const ex of workoutData.exercises) {
      const maxWeightInWorkout = Math.max(
        0,
        ...ex.sets.filter((s) => s.completed).map((s) => s.weightKg)
      );
      const setWithMax = ex.sets.find((s) => s.weightKg === maxWeightInWorkout && s.completed);

      if (maxWeightInWorkout > 0 && setWithMax) {
        const existingPrIdx = prsStore.findIndex((p) => p.exerciseId === ex.exerciseId);
        const existingMax = existingPrIdx !== -1 ? prsStore[existingPrIdx].maxWeightKg : 0;

        if (isNewPersonalRecord(maxWeightInWorkout, existingMax)) {
          const estimated1RM = calculateEpley1RM(maxWeightInWorkout, setWithMax.reps);
          const prRecord: PersonalRecord = {
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            maxWeightKg: maxWeightInWorkout,
            reps: setWithMax.reps,
            estimatedOneRepMax: estimated1RM,
            date: new Date().toISOString().split('T')[0],
          };

          if (existingPrIdx !== -1) {
            prsStore[existingPrIdx] = prRecord;
          } else {
            prsStore.push(prRecord);
          }
          brokenPRs.push(ex.exerciseName);
        }
      }
    }

    if (brokenPRs.length > 0) {
      newEntry.personalRecordsBroken = brokenPRs;
      setStoredData(STORAGE_KEYS.PRS, prsStore);
    }

    return newEntry;
  },

  async getWeightHistory(studentId: string): Promise<WeightRecord[]> {
    await delay();
    return [...weightsStore].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  },

  async logWeight(studentId: string, weightKg: number): Promise<WeightRecord> {
    await delay();
    const newRecord: WeightRecord = {
      date: new Date().toISOString().split('T')[0],
      weightKg,
    };
    // Um registro por dia: o novo substitui o de hoje
    const sameDay = weightsStore.findIndex((w) => w.date === newRecord.date);
    if (sameDay !== -1) weightsStore[sameDay] = newRecord;
    else weightsStore.push(newRecord);
    setStoredData(STORAGE_KEYS.WEIGHTS, weightsStore);

    // Update current student weight
    const sIdx = studentsStore.findIndex((s) => s.id === studentId);
    if (sIdx !== -1) {
      studentsStore[sIdx].currentWeightKg = weightKg;
      setStoredData(STORAGE_KEYS.STUDENTS, studentsStore);
    }

    return newRecord;
  },

  async getPersonalRecords(studentId: string): Promise<PersonalRecord[]> {
    await delay();
    return [...prsStore];
  },

  async getWeeklyMuscleStimulus(studentId: string): Promise<Record<MuscleGroup, MuscleFatigueScore>> {
    await delay();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentWorkouts = historyStore.filter(
      (h) => h.studentId === studentId && new Date(h.startedAt) >= sevenDaysAgo
    );

    return aggregateMuscleStimulus(recentWorkouts);
  },

  async resetToMocks(): Promise<void> {
    await delay();
    studentsStore = [...MOCK_STUDENTS];
    teachersStore = [...MOCK_TEACHERS];
    routinesStore = [...MOCK_ROUTINES];
    exercisesStore = [...MOCK_EXERCISES];
    historyStore = [...MOCK_HISTORY];
    weightsStore = [...MOCK_WEIGHT_RECORDS];
    prsStore = [...MOCK_PERSONAL_RECORDS];

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.STUDENTS);
      localStorage.removeItem(STORAGE_KEYS.ROUTINES);
      localStorage.removeItem(STORAGE_KEYS.EXERCISES);
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
      localStorage.removeItem(STORAGE_KEYS.WEIGHTS);
      localStorage.removeItem(STORAGE_KEYS.PRS);
    }
  },
};

/**
 * Demo: quando o idioma ativo é espanhol, devolve os dados de demonstração
 * traduzidos. Ao trocar este arquivo pela API real, remova este wrapper.
 */
function isSpanishDemo(): boolean {
  try {
    return localStorage.getItem('gymapp_preferred_language') === 'es-PY';
  } catch {
    return false;
  }
}

const demoApi: GymApiService = new Proxy(baseApi, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);
    if (typeof value !== 'function') return value;
    return async (...args: unknown[]) => {
      const result = await value.apply(target, args);
      return isSpanishDemo() ? localizeDemoData(result) : result;
    };
  },
});

/** Modo real (VITE_BACKEND=opengym) usa o servidor openGym; senão, a demo com dados de exemplo. */
export const api: GymApiService = REAL_BACKEND ? openGymApi : demoApi;
