/**
 * Modelos de ficha prontos. O professor escolhe um modelo, o app cria as fichas (A, B, C...)
 * e ele ajusta o que quiser. Usa os exercícios curados (ex-*) e dois do catálogo para cardio.
 */
import type { MuscleGroup, Routine, RoutineExercise } from '../types';

type Lang = 'pt-BR' | 'es-PY';
type Bi = Record<Lang, string>;

export interface TemplateRoutine {
  category: Routine['category'];
  name: Bi;
  description: Bi;
  muscles: MuscleGroup[];
  exercises: Omit<RoutineExercise, 'id'>[];
}

export interface RoutineTemplate {
  id: string;
  name: Bi;
  summary: Bi;
  level: 'beginner' | 'intermediate' | 'advanced';
  routines: TemplateRoutine[];
}

const CARDIO_WALK = 'og-2259'; // caminhada na esteira
const CARDIO_ELLIPTICAL = 'og-2141'; // elíptico

const ex = (
  exerciseId: string,
  sets: number,
  reps: string,
  restSeconds: number,
  extra: Partial<RoutineExercise> = {}
): Omit<RoutineExercise, 'id'> => ({ exerciseId, sets, reps, targetWeightKg: 0, restSeconds, ...extra });

const cardio = (exerciseId: string, minutes: number): Omit<RoutineExercise, 'id'> =>
  ex(exerciseId, 1, '1', 0, { kind: 'cardio', durationSec: minutes * 60 });

const plank = (sets = 3, sec = 40) => ex('ex-plank', sets, '1', 45, { kind: 'time', durationSec: sec });

const dbl = { progression: 'double' as const, incrementKg: 2 };
const lin = { progression: 'linear' as const, incrementKg: 2.5 };

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    id: 'iniciante',
    level: 'beginner',
    name: { 'pt-BR': 'Iniciante · Corpo todo (A/B)', 'es-PY': 'Principiante · Cuerpo completo (A/B)' },
    summary: {
      'pt-BR': '2 fichas alternadas, 3x por semana, com aquecimento e cardio leve.',
      'es-PY': '2 rutinas alternadas, 3 veces por semana, con calentamiento y cardio suave.',
    },
    routines: [
      {
        category: 'A',
        name: { 'pt-BR': 'Iniciante A · Corpo todo', 'es-PY': 'Principiante A · Cuerpo completo' },
        description: { 'pt-BR': 'Adaptação: técnica antes de carga', 'es-PY': 'Adaptación: técnica antes que carga' },
        muscles: ['quadriceps', 'chest', 'back', 'shoulders', 'abs'],
        exercises: [
          cardio(CARDIO_WALK, 8),
          ex('ex-leg-press-45', 3, '12-15', 75, { warmupSets: 1, ...dbl }),
          ex('ex-chest-fly-machine', 3, '12-15', 60, dbl),
          ex('ex-lat-pulldown', 3, '12-15', 60, { ...dbl, alternativeId: 'ex-seated-cable-row' }),
          ex('ex-lateral-raise', 2, '12-15', 45),
          plank(3, 30),
        ],
      },
      {
        category: 'B',
        name: { 'pt-BR': 'Iniciante B · Corpo todo', 'es-PY': 'Principiante B · Cuerpo completo' },
        description: { 'pt-BR': 'Adaptação: técnica antes de carga', 'es-PY': 'Adaptación: técnica antes que carga' },
        muscles: ['hamstrings', 'glutes', 'back', 'chest', 'biceps', 'triceps'],
        exercises: [
          cardio(CARDIO_ELLIPTICAL, 8),
          ex('ex-seated-leg-curl', 3, '12-15', 60, dbl),
          ex('ex-seated-cable-row', 3, '12-15', 60, dbl),
          ex('ex-incline-dumbbell-press', 3, '10-12', 75, { warmupSets: 1, ...dbl }),
          ex('ex-hammer-curl', 2, '12-15', 45),
          ex('ex-triceps-rope-pushdown', 2, '12-15', 45),
        ],
      },
    ],
  },
  {
    id: 'abc',
    level: 'intermediate',
    name: { 'pt-BR': 'ABC · Hipertrofia', 'es-PY': 'ABC · Hipertrofia' },
    summary: {
      'pt-BR': 'Peito e tríceps · Costas e bíceps · Pernas e ombros. O clássico das academias.',
      'es-PY': 'Pecho y tríceps · Espalda y bíceps · Piernas y hombros. El clásico del gimnasio.',
    },
    routines: [
      {
        category: 'A',
        name: { 'pt-BR': 'Treino A · Peito e tríceps', 'es-PY': 'Rutina A · Pecho y tríceps' },
        description: { 'pt-BR': 'Hipertrofia', 'es-PY': 'Hipertrofia' },
        muscles: ['chest', 'triceps'],
        exercises: [
          ex('ex-bench-press', 4, '8-10', 90, { warmupSets: 2, ...lin }),
          ex('ex-incline-dumbbell-press', 3, '10-12', 75, dbl),
          ex('ex-cable-crossover', 3, '12-15', 60, { alternativeId: 'ex-chest-fly-machine' }),
          ex('ex-triceps-rope-pushdown', 3, '10-12', 0, { groupWithNext: true }),
          ex('ex-overhead-triceps-extension', 3, '10-12', 60),
        ],
      },
      {
        category: 'B',
        name: { 'pt-BR': 'Treino B · Costas e bíceps', 'es-PY': 'Rutina B · Espalda y bíceps' },
        description: { 'pt-BR': 'Hipertrofia', 'es-PY': 'Hipertrofia' },
        muscles: ['back', 'biceps'],
        exercises: [
          ex('ex-lat-pulldown', 4, '8-10', 90, { warmupSets: 1, ...dbl, alternativeId: 'ex-pullup' }),
          ex('ex-barbell-row', 3, '8-10', 90, lin),
          ex('ex-seated-cable-row', 3, '10-12', 75, dbl),
          ex('ex-barbell-curl', 3, '8-10', 0, { groupWithNext: true }),
          ex('ex-hammer-curl', 3, '10-12', 60),
        ],
      },
      {
        category: 'C',
        name: { 'pt-BR': 'Treino C · Pernas e ombros', 'es-PY': 'Rutina C · Piernas y hombros' },
        description: { 'pt-BR': 'Hipertrofia', 'es-PY': 'Hipertrofia' },
        muscles: ['quadriceps', 'hamstrings', 'glutes', 'shoulders'],
        exercises: [
          ex('ex-squat', 4, '8-10', 120, { warmupSets: 2, ...lin, alternativeId: 'ex-leg-press-45' }),
          ex('ex-leg-press-45', 3, '10-12', 90, dbl),
          ex('ex-lying-leg-curl', 3, '10-12', 60, dbl),
          ex('ex-overhead-press', 3, '8-10', 90, lin),
          ex('ex-lateral-raise', 3, '12-15', 45, { technique: 'dropset' }),
        ],
      },
    ],
  },
  {
    id: 'ppl',
    level: 'intermediate',
    name: { 'pt-BR': 'Push / Pull / Legs', 'es-PY': 'Push / Pull / Legs' },
    summary: {
      'pt-BR': 'Empurrar, puxar e pernas. Dá para fazer 3 ou 6 vezes por semana.',
      'es-PY': 'Empujar, tirar y piernas. Se puede hacer 3 o 6 veces por semana.',
    },
    routines: [
      {
        category: 'A',
        name: { 'pt-BR': 'Push · Empurrar', 'es-PY': 'Push · Empujar' },
        description: { 'pt-BR': 'Peito, ombros e tríceps', 'es-PY': 'Pecho, hombros y tríceps' },
        muscles: ['chest', 'shoulders', 'triceps'],
        exercises: [
          ex('ex-bench-press', 4, '6-8', 120, { warmupSets: 2, ...lin }),
          ex('ex-overhead-press', 3, '8-10', 90, lin),
          ex('ex-incline-dumbbell-press', 3, '10-12', 75, dbl),
          ex('ex-lateral-raise', 3, '12-15', 45),
          ex('ex-triceps-rope-pushdown', 3, '10-12', 60, { technique: 'dropset' }),
        ],
      },
      {
        category: 'B',
        name: { 'pt-BR': 'Pull · Puxar', 'es-PY': 'Pull · Tirar' },
        description: { 'pt-BR': 'Costas, trapézio e bíceps', 'es-PY': 'Espalda, trapecio y bíceps' },
        muscles: ['back', 'biceps'],
        exercises: [
          ex('ex-pullup', 4, '6-10', 120, { alternativeId: 'ex-lat-pulldown' }),
          ex('ex-barbell-row', 4, '6-8', 120, { warmupSets: 1, ...lin }),
          ex('ex-face-pull', 3, '12-15', 60),
          ex('ex-barbell-curl', 3, '8-10', 75, dbl),
          ex('ex-incline-dumbbell-curl', 2, '10-12', 60),
        ],
      },
      {
        category: 'C',
        name: { 'pt-BR': 'Legs · Pernas', 'es-PY': 'Legs · Piernas' },
        description: { 'pt-BR': 'Quadríceps, posterior, glúteos e panturrilha', 'es-PY': 'Cuádriceps, isquios, glúteos y pantorrillas' },
        muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
        exercises: [
          ex('ex-squat', 4, '6-8', 150, { warmupSets: 2, ...lin }),
          ex('ex-romanian-deadlift', 3, '8-10', 120, lin),
          ex('ex-leg-extension', 3, '12-15', 60, { technique: 'restpause' }),
          ex('ex-hip-thrust', 3, '10-12', 90, dbl),
          ex('ex-standing-calf-raise', 4, '12-15', 45),
        ],
      },
    ],
  },
  {
    id: 'superior-inferior',
    level: 'intermediate',
    name: { 'pt-BR': 'Superior / Inferior', 'es-PY': 'Superior / Inferior' },
    summary: {
      'pt-BR': 'Parte de cima e parte de baixo, 4 vezes por semana.',
      'es-PY': 'Tren superior y tren inferior, 4 veces por semana.',
    },
    routines: [
      {
        category: 'Upper',
        name: { 'pt-BR': 'Superiores', 'es-PY': 'Tren superior' },
        description: { 'pt-BR': 'Peito, costas, ombros e braços', 'es-PY': 'Pecho, espalda, hombros y brazos' },
        muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
        exercises: [
          ex('ex-bench-press', 4, '6-8', 120, { warmupSets: 2, ...lin }),
          ex('ex-barbell-row', 4, '6-8', 120, lin),
          ex('ex-overhead-press', 3, '8-10', 90, dbl),
          ex('ex-lat-pulldown', 3, '10-12', 75, dbl),
          ex('ex-barbell-curl', 2, '10-12', 0, { groupWithNext: true }),
          ex('ex-skull-crusher', 2, '10-12', 60),
        ],
      },
      {
        category: 'Lower',
        name: { 'pt-BR': 'Inferiores', 'es-PY': 'Tren inferior' },
        description: { 'pt-BR': 'Pernas, glúteos e core', 'es-PY': 'Piernas, glúteos y core' },
        muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abs'],
        exercises: [
          ex('ex-squat', 4, '6-8', 150, { warmupSets: 2, ...lin }),
          ex('ex-romanian-deadlift', 3, '8-10', 120, lin),
          ex('ex-bulgarian-split-squat', 3, '10-12', 75),
          ex('ex-seated-leg-curl', 3, '10-12', 60, dbl),
          ex('ex-seated-calf-raise', 3, '12-15', 45),
          plank(3, 45),
        ],
      },
    ],
  },
  {
    id: 'abcd',
    level: 'advanced',
    name: { 'pt-BR': 'ABCD · Avançado', 'es-PY': 'ABCD · Avanzado' },
    summary: {
      'pt-BR': 'Um grupo forte por dia, com drop set, rest-pause e bi-sets.',
      'es-PY': 'Un grupo fuerte por día, con drop set, rest-pause y bi-series.',
    },
    routines: [
      {
        category: 'A',
        name: { 'pt-BR': 'A · Peito', 'es-PY': 'A · Pecho' },
        description: { 'pt-BR': 'Volume alto', 'es-PY': 'Volumen alto' },
        muscles: ['chest', 'triceps'],
        exercises: [
          ex('ex-bench-press', 4, '6-8', 150, { warmupSets: 2, ...lin }),
          ex('ex-incline-dumbbell-press', 4, '8-10', 90, dbl),
          ex('ex-dips-chest', 3, '8-12', 90),
          ex('ex-cable-crossover', 3, '12-15', 0, { groupWithNext: true }),
          ex('ex-pushup', 3, '12-15', 75, { technique: 'restpause' }),
        ],
      },
      {
        category: 'B',
        name: { 'pt-BR': 'B · Costas', 'es-PY': 'B · Espalda' },
        description: { 'pt-BR': 'Volume alto', 'es-PY': 'Volumen alto' },
        muscles: ['back', 'biceps'],
        exercises: [
          ex('ex-pullup', 4, '6-10', 120, { warmupSets: 1 }),
          ex('ex-barbell-row', 4, '6-8', 120, lin),
          ex('ex-dumbbell-row', 3, '8-10', 90, dbl),
          ex('ex-straight-arm-pulldown', 3, '12-15', 60, { technique: 'dropset' }),
          ex('ex-shrug', 3, '10-12', 60),
        ],
      },
      {
        category: 'C',
        name: { 'pt-BR': 'C · Pernas', 'es-PY': 'C · Piernas' },
        description: { 'pt-BR': 'Volume alto', 'es-PY': 'Volumen alto' },
        muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
        exercises: [
          ex('ex-squat', 5, '5-8', 180, { warmupSets: 3, ...lin }),
          ex('ex-leg-press-45', 4, '10-12', 120, { technique: 'dropset' }),
          ex('ex-romanian-deadlift', 3, '8-10', 120, lin),
          ex('ex-leg-extension', 3, '12-15', 0, { groupWithNext: true }),
          ex('ex-lying-leg-curl', 3, '12-15', 75),
          ex('ex-standing-calf-raise', 4, '10-15', 45, { technique: 'restpause' }),
        ],
      },
      {
        category: 'D',
        name: { 'pt-BR': 'D · Ombros, braços e abdômen', 'es-PY': 'D · Hombros, brazos y abdomen' },
        description: { 'pt-BR': 'Volume alto', 'es-PY': 'Volumen alto' },
        muscles: ['shoulders', 'biceps', 'triceps', 'abs'],
        exercises: [
          ex('ex-overhead-press', 4, '6-8', 120, { warmupSets: 1, ...lin }),
          ex('ex-lateral-raise', 4, '12-15', 45, { technique: 'dropset' }),
          ex('ex-barbell-curl', 3, '8-10', 0, { groupWithNext: true }),
          ex('ex-close-grip-bench', 3, '8-10', 90),
          ex('ex-cable-crunch', 3, '12-15', 0, { groupWithNext: true }),
          ex('ex-hanging-leg-raise', 3, '10-12', 60),
        ],
      },
    ],
  },
  {
    id: 'emagrecimento',
    level: 'beginner',
    name: { 'pt-BR': 'Emagrecimento · Circuito', 'es-PY': 'Pérdida de peso · Circuito' },
    summary: {
      'pt-BR': 'Bi-sets com pouco descanso e cardio no fim. Gasta mais em menos tempo.',
      'es-PY': 'Bi-series con poco descanso y cardio al final. Más gasto en menos tiempo.',
    },
    routines: [
      {
        category: 'FullBody',
        name: { 'pt-BR': 'Circuito queima', 'es-PY': 'Circuito quema' },
        description: { 'pt-BR': 'Pouco descanso, ritmo constante', 'es-PY': 'Poco descanso, ritmo constante' },
        muscles: ['quadriceps', 'chest', 'back', 'glutes', 'abs'],
        exercises: [
          ex('ex-leg-press-45', 3, '15', 0, { groupWithNext: true }),
          ex('ex-pushup', 3, '12', 45),
          ex('ex-walking-lunges', 3, '12', 0, { groupWithNext: true }),
          ex('ex-seated-cable-row', 3, '15', 45),
          ex('ex-hip-thrust', 3, '15', 0, { groupWithNext: true }),
          plank(3, 30),
          cardio(CARDIO_ELLIPTICAL, 20),
        ],
      },
    ],
  },
];

/** Transforma um modelo nas fichas que vão ser salvas. */
export function routinesFromTemplate(t: RoutineTemplate, lang: Lang, teacherId: string): Omit<Routine, 'id'>[] {
  const stamp = Date.now();
  return t.routines.map((r, ri) => ({
    name: r.name[lang],
    description: r.description[lang],
    category: r.category,
    targetMuscleGroups: r.muscles,
    exercises: r.exercises.map((e, i) => ({ ...e, id: `re-${stamp}-${ri}-${i}` })),
    createdById: teacherId,
    assignedStudentIds: [],
    updatedAt: new Date().toISOString().slice(0, 10),
  }));
}
