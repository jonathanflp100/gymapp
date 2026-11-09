export type SupportedLanguage = 'pt-BR' | 'es-PY';

export type UserRole = 'student' | 'teacher';

export interface BrandConfig {
  id: string;
  name: string;
  tagline: string;
  logoUrl?: string; // If empty or fallback, uses brand SVG
  primaryColor: string; // e.g. '#DC2626'
  secondaryColor: string; // e.g. '#111827'
  accentColor: string; // e.g. '#EF4444'
  defaultLanguage: SupportedLanguage;
  whatsapp: string; // e.g. '+55 11 99999-8888' or '+595 981 123456'
  address: string;
  gymCode: string; // e.g. 'FORCA10' or 'TITAN01'
  country: 'BR' | 'PY';
}

export type MuscleGroup = 
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quadriceps'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'abs';

export interface Exercise {
  id: string;
  name: {
    'pt-BR': string;
    'es-PY': string;
  };
  muscleGroup: MuscleGroup;
  secondaryMuscleGroups?: MuscleGroup[];
  equipment: 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight';
  defaultRestSeconds: number;
  instructions?: {
    'pt-BR': string;
    'es-PY': string;
  };
  /** animação de movimento (ver MovementAnimation) */
  pattern?: string;
  /** Grupo de equipamento (ver src/services/inventory.ts) */
  kit?: string;
  /** 'catalogue' = veio do catálogo completo */
  source?: 'curated' | 'catalogue';
}

export interface RoutineExercise {
  id: string;
  exerciseId: string;
  sets: number;
  reps: string; // e.g. "8-12" or "10"
  targetWeightKg: number;
  restSeconds: number;
  notes?: string;
  previousWeightKg?: number; // Pre-filled from last completed workout
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  category: 'A' | 'B' | 'C' | 'D' | 'FullBody' | 'Upper' | 'Lower';
  targetMuscleGroups: MuscleGroup[];
  exercises: RoutineExercise[];
  createdById: string; // Teacher ID
  assignedStudentIds: string[];
  updatedAt: string;
}

export interface SetLog {
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
  isPersonalRecord?: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
}

export interface WorkoutHistoryEntry {
  id: string;
  studentId: string;
  routineId?: string;
  routineName: string;
  startedAt: string;
  completedAt: string;
  durationMinutes: number;
  totalVolumeKg: number;
  totalSets: number;
  muscleGroups: MuscleGroup[];
  exercises: {
    exerciseId: string;
    exerciseName: string;
    sets: SetLog[];
  }[];
  personalRecordsBroken?: string[]; // Names of exercises where PR was achieved
  notes?: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  gymCode: string;
  role: 'student';
  avatarUrl?: string;
  gender: 'M' | 'F' | 'O';
  currentWeightKg: number;
  targetWeightKg: number;
  heightCm: number;
  joinDate: string;
  currentStreakDays: number;
  lastWorkoutDate?: string;
  activeRoutineId?: string;
  teacherId: string;
  plan: 'Mensal' | 'Trimestral' | 'Anual';
  status: 'active' | 'inactive';
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  gymCode: string;
  role: 'teacher';
  avatarUrl?: string;
  specialty: string;
  phone: string;
}

export interface WeightRecord {
  date: string;
  weightKg: number;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  maxWeightKg: number;
  reps: number;
  estimatedOneRepMax: number;
  date: string;
}

export interface MuscleFatigueScore {
  muscleGroup: MuscleGroup;
  volumeKg: number;
  setsCount: number;
  intensity: 'none' | 'light' | 'moderate' | 'high';
}

// ---------------------------------------------------------------- Aulas coletivas e avaliação física

export type Bilingual = { 'pt-BR': string; 'es-PY': string };

export interface GroupClass {
  id: string;
  name: Bilingual;
  description: Bilingual;
  /** 0 = domingo ... 6 = sábado */
  weekday: number;
  time: string; // "18:30"
  durationMin: number;
  teacherId: string;
  teacherName?: string;
  room: Bilingual;
  capacity: number;
  color: string;
  intensity: 1 | 2 | 3;
}

export interface ClassBooking {
  classId: string;
  date: string; // AAAA-MM-DD
  studentId: string;
}

export interface BodyAssessment {
  id: string;
  studentId: string;
  teacherId: string;
  teacherName?: string;
  date: string; // AAAA-MM-DD
  weightKg: number;
  bodyFatPct: number;
  muscleMassKg: number;
  waistCm: number;
  hipCm: number;
  chestCm: number;
  armCm: number;
  thighCm: number;
  restingHr: number;
  notes?: string;
}

// ---------------------------------------------------------------- Mural, check-in e desafios

export interface Announcement {
  id: string;
  title: string;
  body: string;
  kind: 'info' | 'promo' | 'alert';
  pinned: boolean;
  expiresAt: string | null;
  authorName: string;
  createdAt: string;
}

export type ChallengeMetric = 'workouts' | 'checkins' | 'classes';

export interface Challenge {
  id: string;
  title: Bilingual;
  reward: Bilingual;
  metric: ChallengeMetric;
  target: number;
  month: string; // AAAA-MM
  createdAt: string;
  progress: number;
  done: boolean;
  completedBy?: { id: string; name: string }[];
  participants?: number;
}

export interface CheckinStats {
  days: { date: string; count: number }[];
  today: { id: string; name: string; at: string }[];
}
