/**
 * Backend REAL: liga o GymApp ao servidor openGym.
 *
 * O openGym guarda, por usuário, um único documento JSON (GET/PUT /api/data) com
 * rotinas, treinos e pesagens. Este arquivo converte esse documento para os tipos
 * do GymApp e grava de volta no formato do openGym, então os mesmos dados também
 * abrem no app oficial do openGym.
 *
 * Ativado quando o app é compilado com VITE_BACKEND=opengym.
 */
import {
  Exercise,
  MuscleGroup,
  MuscleFatigueScore,
  PersonalRecord,
  Routine,
  Student,
  Teacher,
  WeightRecord,
  WorkoutHistoryEntry,
} from '../types';
import { MOCK_EXERCISES, MOCK_ROUTINES } from '../data/mockData';
import { toAppId, toCatalogueId } from '../data/catalogueMap';
import { localizeDemoData } from '../data/demoLocaleEs';
import { searchExercises, loadCatalogue, getCatalogueExercise, isCatalogueId } from './catalogue';
import { aggregateMuscleStimulus, calculateEpley1RM, calculateStreak } from '../utils/rules';
import type { GymApiService } from './api';
import { hub, HubMember } from './hub';

export const REAL_BACKEND = import.meta.env.VITE_BACKEND === 'opengym';

// ---------------------------------------------------------------- tipos openGym

interface OgSet { w: number; r: number; done?: boolean }
interface OgEntry { id: string; topW?: number | null; sets: OgSet[] }
interface OgWorkout {
  id: string; d: string; start: number; end: number; routineId?: string; name: string;
  vol?: number; prs?: string[]; entries: OgEntry[]; _ts?: number;
}
interface OgRoutineEx {
  id: string; sets: number; reps: number; repsMax?: number; weight: number;
  mode: 'reps'; restSec?: number; note?: string;
}
interface OgRoutine {
  id: string; name: string; ex: OgRoutineEx[]; _ts?: number;
  // Campos extras do GymApp (o openGym aceita e preserva campos adicionais)
  gx?: { description?: string; category?: Routine['category']; muscles?: MuscleGroup[]; updatedAt?: string };
}
interface OgBodyweight { d: string; w: number; t?: number }
interface OgState {
  unit?: 'kg' | 'lb'; lang?: string; routines?: OgRoutine[]; workouts?: OgWorkout[];
  bodyweight?: OgBodyweight[]; [k: string]: unknown;
}
export interface OgUser { id: string; name: string; admin?: boolean }

// ---------------------------------------------------------------- HTTP

async function http<T>(method: string, path: string, body?: unknown): Promise<{ status: number; data: T }> {
  const res = await fetch(path, {
    method,
    credentials: 'include',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* corpo vazio */
  }
  return { status: res.status, data };
}

// ---------------------------------------------------------------- sessão e cache

let me: OgUser | null = null;
let cache: OgState | null = null;
let rev = 0;

async function pull(): Promise<OgState> {
  const { status, data } = await http<{ state: OgState | null; rev: number }>('GET', '/api/data');
  if (status === 401) throw new Error('not-signed-in');
  cache = data?.state ?? {};
  rev = data?.rev ?? 0;
  return cache;
}

async function state(): Promise<OgState> {
  return cache ?? pull();
}

/** Aplica uma mudança e grava. Se outro aparelho gravou antes (409), relê e aplica de novo. */
async function mutate(change: (s: OgState) => void): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = structuredClone(await state());
    change(current);
    current._ts = Date.now();
    const { status, data } = await http<any>('PUT', '/api/data', { baseRev: rev, state: current });
    if (status === 200) {
      cache = current;
      rev = data?.rev ?? rev + 1;
      return;
    }
    if (status === 409) {
      cache = data?.state ?? null;
      rev = data?.rev ?? rev;
      if (!cache) await pull();
      continue;
    }
    throw new Error(`Falha ao salvar (${status})`);
  }
  throw new Error('Falha ao salvar: conflito com outro aparelho');
}

// ---------------------------------------------------------------- autenticação

const ERRORS: Record<string, [string, string]> = {
  login: ['Nome/e-mail ou senha incorretos.', 'Nombre/e-mail o contraseña incorrectos.'],
  'too-common': ['Essa senha é muito comum. Escolha outra.', 'Esa contraseña es muy común. Elegí otra.'],
  'email-taken': ['Esse e-mail já está em uso.', 'Ese e-mail ya está en uso.'],
  'email-invalid': ['E-mail inválido.', 'E-mail inválido.'],
  invite: ['Código de convite inválido.', 'Código de invitación inválido.'],
  disabled: ['Conta desativada. Fale com a academia.', 'Cuenta desactivada. Hablá con el gimnasio.'],
  rate: ['Muitas tentativas. Aguarde um pouco.', 'Demasiados intentos. Esperá un momento.'],
  'name-taken': ['Esse nome já está em uso. Use outro.', 'Ese nombre ya está en uso. Usá otro.'],
};

function errorText(key: string, fallback?: string): string {
  const msg = ERRORS[key];
  if (!msg) return fallback || ERRORS.login[currentLang() === 'es-PY' ? 1 : 0];
  return msg[currentLang() === 'es-PY' ? 1 : 0];
}

function registerError(status: number, data: any): string {
  if (status === 429) return errorText('rate');
  if (data?.code && ERRORS[data.code]) return errorText(data.code);
  if (status === 409) return errorText('name-taken');
  return data?.error || errorText('login');
}

export const openGymAuth = {
  async currentUser(): Promise<OgUser | null> {
    const { status, data } = await http<{ user: OgUser }>('GET', '/api/me');
    me = status === 200 ? data.user : null;
    if (!me) cache = null;
    return me;
  },

  async login(identifier: string, password: string): Promise<{ ok: boolean; error?: string }> {
    const { status, data } = await http<any>('POST', '/api/login/password', { identifier, password });
    if (status !== 200) return { ok: false, error: errorText(status === 429 ? 'rate' : data?.code === 'disabled' ? 'disabled' : 'login') };
    cache = null;
    await this.currentUser();
    return { ok: true };
  },

  async register(name: string, password: string, email?: string, code?: string): Promise<{ ok: boolean; error?: string }> {
    const body: Record<string, string> = { name, password };
    if (email) body.email = email;
    if (code) body.code = code;
    const { status, data } = await http<any>('POST', '/api/register/password', body);
    if (status !== 200) return { ok: false, error: registerError(status, data) };
    cache = null;
    await this.currentUser();
    return { ok: true };
  },

  async logout(): Promise<void> {
    await http('POST', '/api/logout', {});
    me = null;
    cache = null;
  },

  /** Conta nova: grava as fichas iniciais (A, B, C) para o aluno já ter treino. */
  async seedIfEmpty(lang: string): Promise<void> {
    const s = await state();
    if ((s.routines?.length ?? 0) > 0) return;
    await mutate((doc) => {
      doc.unit = doc.unit ?? 'kg';
      doc.lang = doc.lang ?? (lang === 'es-PY' ? 'es' : 'pt-BR');
      const starters = lang === 'es-PY' ? localizeDemoData(MOCK_ROUTINES) : MOCK_ROUTINES;
      doc.routines = starters.map((r) => routineToOg({ ...r, id: `gx-${r.category.toLowerCase()}` }));
      doc.workouts = doc.workouts ?? [];
      doc.bodyweight = doc.bodyweight ?? [];
    });
  },
};

// ---------------------------------------------------------------- conversões

const exerciseById = new Map(MOCK_EXERCISES.map((e) => [e.id, e]));
/** Exercício curado ou do catálogo completo (o catálogo precisa estar carregado). */
const lookup = (id: string) => exerciseById.get(id) ?? getCatalogueExercise(id) ?? undefined;
/** Dia local (AAAA-MM-DD). toISOString usaria UTC e viraria o dia às 21h no Brasil. */
const localDay = (t: number | Date = new Date()) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const today = () => localDay();

function parseReps(reps: string): { reps: number; repsMax?: number } {
  const [a, b] = reps.split('-').map((n) => parseInt(n, 10));
  return { reps: Number.isFinite(a) ? a : 10, repsMax: Number.isFinite(b) ? b : undefined };
}

function routineToOg(r: Routine): OgRoutine {
  return {
    id: r.id,
    name: r.name,
    _ts: Date.now(),
    ex: r.exercises.map((e) => {
      const { reps, repsMax } = parseReps(e.reps);
      return {
        id: toCatalogueId(e.exerciseId),
        sets: e.sets,
        reps,
        ...(repsMax ? { repsMax } : {}),
        weight: e.targetWeightKg,
        mode: 'reps' as const,
        restSec: e.restSeconds,
        ...(e.notes ? { note: e.notes } : {}),
      };
    }),
    gx: {
      description: r.description,
      category: r.category,
      muscles: r.targetMuscleGroups,
      updatedAt: r.updatedAt,
    },
  };
}

function lastWeightFor(s: OgState, catalogueId: string): number | undefined {
  const workouts = s.workouts ?? [];
  for (let i = workouts.length - 1; i >= 0; i--) {
    const entry = workouts[i].entries?.find((e) => e.id === catalogueId);
    const done = entry?.sets?.filter((x) => x.done !== false && x.w > 0);
    if (done && done.length) return Math.max(...done.map((x) => x.w));
  }
  return undefined;
}

function routineFromOg(r: OgRoutine, s: OgState, studentId: string): Routine {
  const exercises = (r.ex ?? []).map((e, i) => {
    const appId = toAppId(e.id);
    return {
      id: `${r.id}-${i}`,
      exerciseId: appId,
      sets: e.sets ?? 3,
      reps: e.repsMax ? `${e.reps}-${e.repsMax}` : String(e.reps ?? 10),
      targetWeightKg: e.weight ?? 0,
      restSeconds: e.restSec ?? lookup(appId)?.defaultRestSeconds ?? 90,
      notes: e.note,
      previousWeightKg: lastWeightFor(s, e.id),
    };
  });
  const muscles =
    r.gx?.muscles ??
    Array.from(new Set(exercises.map((e) => lookup(e.exerciseId)?.muscleGroup).filter(Boolean))) as MuscleGroup[];
  return {
    id: r.id,
    name: r.name,
    description: r.gx?.description,
    category: r.gx?.category ?? 'FullBody',
    targetMuscleGroups: muscles,
    exercises,
    createdById: 'opengym',
    assignedStudentIds: [studentId],
    updatedAt: r.gx?.updatedAt ?? today(),
  };
}

function exerciseName(appId: string, lang: string): string {
  const ex = lookup(appId);
  if (!ex) return lang === 'es-PY' ? `Ejercicio ${appId}` : `Exercício ${appId}`;
  return lang === 'es-PY' ? ex.name['es-PY'] : ex.name['pt-BR'];
}

function workoutFromOg(w: OgWorkout, studentId: string, lang: string): WorkoutHistoryEntry {
  const exercises = (w.entries ?? []).map((e) => {
    const appId = toAppId(e.id);
    return {
      exerciseId: appId,
      exerciseName: exerciseName(appId, lang),
      sets: (e.sets ?? []).map((x, i) => ({
        setNumber: i + 1,
        weightKg: x.w ?? 0,
        reps: x.r ?? 0,
        completed: x.done !== false,
      })),
    };
  });
  const completedSets = exercises.flatMap((e) => e.sets.filter((x) => x.completed));
  const volume = w.vol ?? completedSets.reduce((acc, x) => acc + x.weightKg * x.reps, 0);
  const muscles = Array.from(
    new Set(exercises.map((e) => lookup(e.exerciseId)?.muscleGroup).filter(Boolean))
  ) as MuscleGroup[];
  const start = w.start ?? Date.parse(w.d);
  const end = w.end ?? start;
  return {
    id: w.id,
    studentId,
    routineId: w.routineId,
    routineName: w.name ?? '—',
    startedAt: new Date(start).toISOString(),
    completedAt: new Date(end).toISOString(),
    durationMinutes: Math.max(1, Math.round((end - start) / 60000)),
    totalVolumeKg: Math.round(volume),
    totalSets: completedSets.length,
    muscleGroups: muscles,
    exercises,
    personalRecordsBroken: (w.prs ?? []).map((id) => exerciseName(toAppId(id), lang)),
  };
}

function currentLang(): string {
  try {
    return localStorage.getItem('gymapp_preferred_language') || 'pt-BR';
  } catch {
    return 'pt-BR';
  }
}

function computePRs(s: OgState, lang: string): PersonalRecord[] {
  const best = new Map<string, PersonalRecord>();
  for (const w of s.workouts ?? []) {
    for (const e of w.entries ?? []) {
      for (const x of e.sets ?? []) {
        if (x.done === false || !x.w) continue;
        const appId = toAppId(e.id);
        const prev = best.get(appId);
        if (!prev || x.w > prev.maxWeightKg) {
          best.set(appId, {
            exerciseId: appId,
            exerciseName: exerciseName(appId, lang),
            maxWeightKg: x.w,
            reps: x.r,
            estimatedOneRepMax: calculateEpley1RM(x.w, x.r),
            date: w.d,
          });
        }
      }
    }
  }
  return Array.from(best.values());
}

// ---------------------------------------------------------------- sessão no servidor da academia

let hubMember: HubMember | null = null;
export const setHubMember = (m: HubMember | null) => {
  hubMember = m;
};
const staff = () => hubMember?.role === 'owner' || hubMember?.role === 'teacher';
const isMe = (id?: string) => !id || id === me?.id || id === 'me';

function buildStudent(s: OgState, gymCode: string): Student {
  const weights = [...(s.bodyweight ?? [])].sort((a, b) => a.d.localeCompare(b.d));
  const workoutDates = (s.workouts ?? []).map((w) => w.d);
  const lastWorkout = [...workoutDates].sort().pop();
  const current = weights.length ? weights[weights.length - 1].w : 0;
  return {
    id: me?.id ?? 'me',
    name: me?.name ?? 'Aluno',
    email: '',
    gymCode,
    role: 'student',
    gender: hubMember?.gender ?? 'O',
    currentWeightKg: current,
    targetWeightKg: hubMember?.targetWeightKg || current,
    heightCm: hubMember?.heightCm ?? 0,
    joinDate: hubMember?.joinedAt?.slice(0, 10) ?? weights[0]?.d ?? today(),
    currentStreakDays: calculateStreak(workoutDates),
    lastWorkoutDate: lastWorkout,
    activeRoutineId: s.routines?.[0]?.id,
    teacherId: '',
    plan: (hubMember?.plan as Student['plan']) ?? 'Mensal',
    status: hubMember?.status ?? 'active',
  };
}

function memberToStudent(m: HubMember, weightKg = 0): Student {
  return {
    id: m.id,
    name: m.name,
    email: '',
    gymCode: gymCodeForStudent,
    role: 'student',
    gender: m.gender ?? 'O',
    currentWeightKg: weightKg,
    targetWeightKg: m.targetWeightKg ?? weightKg,
    heightCm: m.heightCm ?? 0,
    joinDate: m.joinedAt.slice(0, 10),
    currentStreakDays: m.stats.streak,
    lastWorkoutDate: m.stats.lastWorkoutAt ?? undefined,
    teacherId: '',
    plan: (m.plan as Student['plan']) ?? 'Mensal',
    status: m.status,
  };
}

function memberToTeacher(m: HubMember): Teacher {
  return {
    id: m.id,
    name: m.name,
    email: '',
    gymCode: gymCodeForStudent,
    role: 'teacher',
    specialty: m.role === 'owner' ? 'Administrador' : 'Professor',
    phone: '',
  };
}

// ---------------------------------------------------------------- serviço

let gymCodeForStudent = '';
export const setRealGymCode = (code: string) => {
  gymCodeForStudent = code;
};

/** Fichas da academia (criadas pela equipe) que valem para este aluno. */
async function hubRoutinesSafe(): Promise<Routine[]> {
  try {
    return await hub.routines();
  } catch {
    return [];
  }
}

export const openGymApi: GymApiService = {
  async getStudents() {
    if (staff()) {
      const list = await hub.members();
      return list.filter((m) => m.role === 'student').map((m) => memberToStudent(m));
    }
    return me ? [buildStudent(await state(), gymCodeForStudent)] : [];
  },
  async getStudentById(id) {
    if (me && isMe(id)) return buildStudent(await state(), gymCodeForStudent);
    if (!staff()) return null;
    try {
      const [m, assessments] = await Promise.all([hub.member(id), hub.assessments(id)]);
      return memberToStudent(m, assessments[assessments.length - 1]?.weightKg ?? 0);
    } catch {
      return null;
    }
  },
  async updateStudent(id, updates) {
    if (hubMember) {
      const target = isMe(id) ? hubMember.id : id;
      const m = await hub.updateMember(target, updates as Partial<HubMember>);
      if (isMe(id)) hubMember = { ...hubMember, ...m };
    }
    return isMe(id) ? buildStudent(await state(), gymCodeForStudent) : ((await this.getStudentById(id)) as Student);
  },

  async getTeachers(): Promise<Teacher[]> {
    if (!staff()) return [];
    const list = await hub.members();
    return list.filter((m) => m.role !== 'student').map(memberToTeacher);
  },
  async getTeacherById(id) {
    if (hubMember && hubMember.id === id && staff()) return memberToTeacher(hubMember);
    return null;
  },

  async getRoutines() {
    if (staff()) return hub.routines();
    const s = await state();
    const own = (s.routines ?? []).map((r) => routineFromOg(r, s, me?.id ?? 'me'));
    const fromGym = (await hubRoutinesSafe()).map((r) => ({
      ...r,
      exercises: r.exercises.map((e) => ({ ...e, previousWeightKg: lastWeightFor(s, toCatalogueId(e.exerciseId)) })),
    }));
    // Fichas do professor primeiro
    return [...fromGym, ...own];
  },
  async getRoutineById(id) {
    const all = await this.getRoutines(me?.id);
    return all.find((r) => r.id === id) ?? null;
  },
  async saveRoutine(data) {
    if (staff()) return hub.saveRoutine(data as Partial<Routine>);
    const routine: Routine = { ...data, id: data.id || `gx-${Date.now()}`, updatedAt: today() };
    await mutate((doc) => {
      const list = doc.routines ?? [];
      const idx = list.findIndex((r) => r.id === routine.id);
      const og = routineToOg(routine);
      if (idx >= 0) list[idx] = { ...list[idx], ...og };
      else list.unshift(og);
      doc.routines = list;
    });
    return routine;
  },
  async deleteRoutine(id) {
    if (staff()) {
      await hub.deleteRoutine(id);
      return true;
    }
    await mutate((doc) => {
      doc.routines = (doc.routines ?? []).filter((r) => r.id !== id);
    });
    return true;
  },
  async assignRoutine(routineId, studentIds) {
    if (!staff()) return false;
    await hub.assign(routineId, studentIds);
    return true;
  },

  async getExercises(filter) {
    return searchExercises(MOCK_EXERCISES, filter);
  },
  async getExerciseById(id) {
    if (isCatalogueId(id)) {
      await loadCatalogue();
      return getCatalogueExercise(id);
    }
    return exerciseById.get(id) ?? null;
  },
  async createExercise(data): Promise<Exercise> {
    const ex: Exercise = { ...data, id: `ex-custom-${Date.now()}` };
    MOCK_EXERCISES.unshift(ex);
    exerciseById.set(ex.id, ex);
    return ex;
  },

  async getWorkoutHistory(studentId) {
    await loadCatalogue();
    if (!isMe(studentId)) return staff() ? hub.activity(studentId) : [];
    const s = await state();
    const lang = currentLang();
    return (s.workouts ?? [])
      .map((w) => workoutFromOg(w, me?.id ?? 'me', lang))
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  },

  async finishWorkout(data) {
    const before = computePRs(await state(), currentLang());
    const bestBefore = new Map(before.map((p) => [p.exerciseId, p.maxWeightKg]));
    const prIds: string[] = [];
    const prNames: string[] = [];

    const entries: OgEntry[] = data.exercises.map((e) => {
      const done = e.sets.filter((x) => x.completed && x.weightKg > 0);
      const top = done.length ? Math.max(...done.map((x) => x.weightKg)) : null;
      if (top && top > (bestBefore.get(e.exerciseId) ?? 0) && bestBefore.has(e.exerciseId)) {
        prIds.push(toCatalogueId(e.exerciseId));
        prNames.push(e.exerciseName);
      }
      return {
        id: toCatalogueId(e.exerciseId),
        topW: top,
        sets: e.sets.map((x) => ({ w: x.weightKg, r: x.reps, done: x.completed })),
      };
    });

    const start = Date.parse(data.startedAt) || Date.now();
    const end = Date.parse(data.completedAt) || Date.now();
    const workout: OgWorkout = {
      id: `gx-${end.toString(36)}`,
      d: localDay(end),
      start,
      end,
      routineId: data.routineId,
      name: data.routineName,
      vol: Math.round(data.totalVolumeKg),
      prs: prIds,
      entries,
    };
    await mutate((doc) => {
      doc.workouts = [...(doc.workouts ?? []), workout];
    });
    const result: WorkoutHistoryEntry = {
      ...data,
      id: workout.id,
      studentId: me?.id ?? data.studentId,
      personalRecordsBroken: prNames.length ? prNames : undefined,
    };
    // Resumo para o professor acompanhar (não bloqueia o aluno se o hub falhar)
    hub.postActivity(result).catch(() => undefined);
    return result;
  },

  async getWeightHistory(studentId) {
    if (!isMe(studentId)) {
      if (!staff()) return [];
      return (await hub.assessments(studentId)).map((a) => ({ date: a.date, weightKg: a.weightKg }));
    }
    const s = await state();
    return [...(s.bodyweight ?? [])]
      .sort((a, b) => a.d.localeCompare(b.d))
      .map((b): WeightRecord => ({ date: b.d, weightKg: b.w }));
  },
  async logWeight(_studentId, weightKg) {
    const d = today();
    await mutate((doc) => {
      const list = (doc.bodyweight ?? []).filter((b) => b.d !== d);
      list.push({ d, w: weightKg, t: Date.now() });
      doc.bodyweight = list.sort((a, b) => a.d.localeCompare(b.d));
    });
    return { date: d, weightKg };
  },
  async getPersonalRecords(studentId) {
    if (!isMe(studentId)) return [];
    return computePRs(await state(), currentLang());
  },
  async getWeeklyMuscleStimulus(studentId): Promise<Record<MuscleGroup, MuscleFatigueScore>> {
    const history = await this.getWorkoutHistory(studentId);
    const since = Date.now() - 7 * 86400000;
    return aggregateMuscleStimulus(history.filter((h) => Date.parse(h.startedAt) >= since));
  },

  async resetToMocks() {
    cache = null;
  },
};
