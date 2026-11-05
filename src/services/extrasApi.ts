/**
 * Aulas coletivas e avaliação física.
 *
 * Por enquanto vivem só no aparelho (localStorage), com dados de exemplo, nos dois
 * modos (demo e completo). Quando o servidor ganhar essas funções, troque as
 * implementações abaixo por chamadas HTTP: as telas só usam `extrasApi`.
 */
import { BodyAssessment, ClassBooking, GroupClass, Student } from '../types';
import { MOCK_STUDENTS } from '../data/mockData';

const KEYS = {
  classes: 'gymapp_extra_classes',
  bookings: 'gymapp_extra_bookings',
  assessments: 'gymapp_extra_assessments',
};

function load<T>(key: string, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    /* sem armazenamento: usa o padrão */
  }
  return fallback();
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignora */
  }
}

export const localDay = (t: number | Date = new Date()) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const addDays = (base: Date, n: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
};

// Número pseudoaleatório estável (mesmo resultado a cada carregamento).
function seeded(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

// ---------------------------------------------------------------- dados de exemplo

const T1 = 'teacher-1';
const T2 = 'teacher-2';

const CLASS_TEMPLATES: Omit<GroupClass, 'id' | 'weekday' | 'time'>[] = [
  {
    name: { 'pt-BR': 'Spinning', 'es-PY': 'Spinning' },
    description: {
      'pt-BR': 'Pedalada em grupo com música, subidas e sprints. Leve toalha e garrafa de água.',
      'es-PY': 'Pedaleo grupal con música, subidas y sprints. Traé toalla y botella de agua.',
    },
    durationMin: 45,
    teacherId: T2,
    room: { 'pt-BR': 'Sala Bike', 'es-PY': 'Sala Bike' },
    capacity: 20,
    color: '#f97316',
    intensity: 3,
  },
  {
    name: { 'pt-BR': 'Funcional', 'es-PY': 'Funcional' },
    description: {
      'pt-BR': 'Circuito com peso corporal, kettlebell e cordas para força e condicionamento.',
      'es-PY': 'Circuito con peso corporal, kettlebell y sogas para fuerza y resistencia.',
    },
    durationMin: 50,
    teacherId: T1,
    room: { 'pt-BR': 'Área Funcional', 'es-PY': 'Área Funcional' },
    capacity: 16,
    color: '#22c55e',
    intensity: 3,
  },
  {
    name: { 'pt-BR': 'Zumba', 'es-PY': 'Zumba' },
    description: {
      'pt-BR': 'Aula de dança aeróbica, divertida e para todos os níveis.',
      'es-PY': 'Clase de baile aeróbico, divertida y para todos los niveles.',
    },
    durationMin: 50,
    teacherId: T2,
    room: { 'pt-BR': 'Sala 2', 'es-PY': 'Sala 2' },
    capacity: 25,
    color: '#ec4899',
    intensity: 2,
  },
  {
    name: { 'pt-BR': 'Pilates Solo', 'es-PY': 'Pilates Mat' },
    description: {
      'pt-BR': 'Fortalecimento do core, postura e flexibilidade no colchonete.',
      'es-PY': 'Fortalecimiento del core, postura y flexibilidad en colchoneta.',
    },
    durationMin: 55,
    teacherId: T1,
    room: { 'pt-BR': 'Sala 1', 'es-PY': 'Sala 1' },
    capacity: 12,
    color: '#8b5cf6',
    intensity: 1,
  },
  {
    name: { 'pt-BR': 'Abdominal Express', 'es-PY': 'Abdominales Express' },
    description: {
      'pt-BR': 'Trinta minutos focados em abdômen e lombar.',
      'es-PY': 'Treinta minutos enfocados en abdomen y zona lumbar.',
    },
    durationMin: 30,
    teacherId: T1,
    room: { 'pt-BR': 'Área Funcional', 'es-PY': 'Área Funcional' },
    capacity: 20,
    color: '#06b6d4',
    intensity: 2,
  },
  {
    name: { 'pt-BR': 'Muay Thai', 'es-PY': 'Muay Thai' },
    description: {
      'pt-BR': 'Técnica, condicionamento e defesa pessoal. Iniciantes são bem-vindos.',
      'es-PY': 'Técnica, acondicionamiento y defensa personal. Principiantes bienvenidos.',
    },
    durationMin: 60,
    teacherId: T2,
    room: { 'pt-BR': 'Tatame', 'es-PY': 'Tatami' },
    capacity: 18,
    color: '#ef4444',
    intensity: 3,
  },
];

// [modelo, dias da semana, horário]
const SCHEDULE: [number, number[], string][] = [
  [0, [1, 3, 5], '06:30'],
  [1, [1, 3, 5], '07:30'],
  [4, [1, 2, 3, 4, 5], '12:15'],
  [3, [2, 4], '08:00'],
  [2, [2, 4], '19:00'],
  [0, [1, 2, 3, 4], '18:30'],
  [1, [2, 4, 6], '19:30'],
  [5, [1, 3], '20:00'],
  [2, [6], '09:00'],
  [3, [6], '10:30'],
];

function defaultClasses(): GroupClass[] {
  const list: GroupClass[] = [];
  SCHEDULE.forEach(([tpl, days, time], i) => {
    for (const weekday of days) {
      list.push({ ...CLASS_TEMPLATES[tpl], id: `class-${i}-${weekday}`, weekday, time });
    }
  });
  return list;
}

function defaultAssessments(): BodyAssessment[] {
  const out: BodyAssessment[] = [];
  const now = new Date();
  for (const s of MOCK_STUDENTS) {
    const female = s.gender === 'F';
    const losing = s.targetWeightKg < s.currentWeightKg;
    const r = seeded(s.id);
    // 4 avaliações, uma a cada ~30 dias, terminando há poucos dias
    for (let k = 3; k >= 0; k--) {
      const step = 3 - k; // 0 = mais antiga
      const date = localDay(addDays(now, -(k * 30 + 4 + Math.round(r * 5))));
      const weight = s.currentWeightKg + (losing ? 1.1 : -0.6) * k;
      const fat = (female ? 27 : 20) + r * 4 + (losing ? 1.2 : 0.6) * k;
      const muscle = weight * (1 - fat / 100) * 0.52 + step * 0.25;
      out.push({
        id: `as-${s.id}-${step}`,
        studentId: s.id,
        teacherId: s.teacherId || T1,
        date,
        weightKg: +weight.toFixed(1),
        bodyFatPct: +fat.toFixed(1),
        muscleMassKg: +muscle.toFixed(1),
        waistCm: +((female ? 72 : 86) + r * 6 + (losing ? 1.5 : 0.4) * k).toFixed(1),
        hipCm: +((female ? 100 : 98) + r * 4 + 0.6 * k).toFixed(1),
        chestCm: +((female ? 90 : 100) + r * 5 - 0.3 * k).toFixed(1),
        armCm: +((female ? 28 : 35) + r * 3 - 0.35 * k).toFixed(1),
        thighCm: +((female ? 56 : 58) + r * 4 - 0.3 * k).toFixed(1),
        restingHr: Math.round(66 + r * 10 + k * 1.5),
      });
    }
  }
  return out;
}

function defaultBookings(classes: GroupClass[]): ClassBooking[] {
  // Ocupação de exemplo para os próximos 7 dias
  const out: ClassBooking[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const day = addDays(today, i);
    const date = localDay(day);
    for (const c of classes.filter((x) => x.weekday === day.getDay())) {
      const fill = Math.round(c.capacity * (0.35 + seeded(c.id + date) * 0.6));
      // 3 alunos cadastrados por aula (rodízio) e o resto visitantes
      const offset = Math.floor(seeded(date + c.id) * MOCK_STUDENTS.length);
      for (let n = 0; n < Math.min(fill, c.capacity); n++) {
        const studentId = n < 3 ? MOCK_STUDENTS[(offset + n) % MOCK_STUDENTS.length].id : `guest-${n}`;
        out.push({ classId: c.id, date, studentId });
      }
    }
  }
  return out;
}

// Alunos de exemplo que ainda não estão na lista de alunos da demo
const GUEST_NAMES = [
  'Ana Paula Rocha', 'Bruno Cardoso', 'Juliana Prado', 'Felipe Moura', 'Larissa Teixeira', 'Thiago Ramos',
  'Mariana Duarte', 'Gustavo Nunes', 'Patrícia Lopes', 'Rafael Costa', 'Valeria Giménez', 'Joaquín Cáceres',
  'Lucía Benítez', 'Diego Ortiz', 'Camila Acosta', 'Martín Insfrán', 'Fernanda Alves', 'Pedro Henrique Dias',
  'Isabela Martins', 'Leonardo Freitas',
];

// ---------------------------------------------------------------- estado

let classes: GroupClass[] = load(KEYS.classes, defaultClasses);
// v2: troca reservas de exemplo antigas
let bookings: ClassBooking[] = load(KEYS.bookings + '_v2', () => defaultBookings(classes));
KEYS.bookings = KEYS.bookings + '_v2';
let assessments: BodyAssessment[] = load(KEYS.assessments, defaultAssessments);

const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120));

export interface ClassOccurrence {
  cls: GroupClass;
  date: string;
  booked: number;
  isBookedByMe: boolean;
  isPast: boolean;
}

export const extrasApi = {
  // ---------- Aulas
  async getClassesForDate(date: string, studentId?: string): Promise<ClassOccurrence[]> {
    const weekday = new Date(`${date}T12:00:00`).getDay();
    const now = new Date();
    return delay(
      classes
        .filter((c) => c.weekday === weekday)
        .sort((a, b) => a.time.localeCompare(b.time))
        .map((cls) => {
          const list = bookings.filter((b) => b.classId === cls.id && b.date === date);
          return {
            cls,
            date,
            booked: list.length,
            isBookedByMe: !!studentId && list.some((b) => b.studentId === studentId),
            isPast: new Date(`${date}T${cls.time}:00`).getTime() < now.getTime(),
          };
        })
    );
  },

  async getMyUpcoming(studentId: string): Promise<ClassOccurrence[]> {
    const now = Date.now();
    const mine = bookings.filter((b) => b.studentId === studentId);
    const result: ClassOccurrence[] = [];
    for (const b of mine) {
      const cls = classes.find((c) => c.id === b.classId);
      if (!cls) continue;
      if (new Date(`${b.date}T${cls.time}:00`).getTime() < now) continue;
      result.push({
        cls,
        date: b.date,
        booked: bookings.filter((x) => x.classId === cls.id && x.date === b.date).length,
        isBookedByMe: true,
        isPast: false,
      });
    }
    return delay(result.sort((a, b) => (a.date + a.cls.time).localeCompare(b.date + b.cls.time)));
  },

  async book(classId: string, date: string, studentId: string): Promise<{ ok: boolean; reason?: 'full' }> {
    const cls = classes.find((c) => c.id === classId);
    const count = bookings.filter((b) => b.classId === classId && b.date === date).length;
    if (!cls || count >= cls.capacity) return delay({ ok: false, reason: 'full' as const });
    if (!bookings.some((b) => b.classId === classId && b.date === date && b.studentId === studentId)) {
      bookings.push({ classId, date, studentId });
      save(KEYS.bookings, bookings);
    }
    return delay({ ok: true });
  },

  async cancel(classId: string, date: string, studentId: string): Promise<void> {
    bookings = bookings.filter((b) => !(b.classId === classId && b.date === date && b.studentId === studentId));
    save(KEYS.bookings, bookings);
    return delay(undefined);
  },

  async getAttendees(classId: string, date: string, students: Student[]): Promise<{ id: string; name: string }[]> {
    const list = bookings.filter((b) => b.classId === classId && b.date === date);
    return delay(
      list.map((b) => ({
        id: b.studentId,
        name:
          students.find((s) => s.id === b.studentId)?.name ??
          GUEST_NAMES[(parseInt(b.studentId.replace('guest-', ''), 10) + classId.length + date.charCodeAt(9)) % GUEST_NAMES.length],
      }))
    );
  },

  async createClass(data: Omit<GroupClass, 'id'>): Promise<GroupClass> {
    const cls: GroupClass = { ...data, id: `class-custom-${Date.now()}` };
    classes.push(cls);
    save(KEYS.classes, classes);
    return delay(cls);
  },

  async deleteClass(id: string): Promise<void> {
    classes = classes.filter((c) => c.id !== id);
    bookings = bookings.filter((b) => b.classId !== id);
    save(KEYS.classes, classes);
    save(KEYS.bookings, bookings);
    return delay(undefined);
  },

  async todaySummary(): Promise<{ classes: number; booked: number; capacity: number }> {
    const list = await this.getClassesForDate(localDay());
    return {
      classes: list.length,
      booked: list.reduce((a, c) => a + c.booked, 0),
      capacity: list.reduce((a, c) => a + c.cls.capacity, 0),
    };
  },

  // ---------- Avaliação física
  async getAssessments(studentId: string): Promise<BodyAssessment[]> {
    return delay(
      assessments.filter((a) => a.studentId === studentId).sort((a, b) => a.date.localeCompare(b.date))
    );
  },

  async saveAssessment(data: Omit<BodyAssessment, 'id'>): Promise<BodyAssessment> {
    const a: BodyAssessment = { ...data, id: `as-${Date.now()}` };
    assessments.push(a);
    save(KEYS.assessments, assessments);
    return delay(a);
  },

  async resetDemo(): Promise<void> {
    classes = defaultClasses();
    bookings = defaultBookings(classes);
    assessments = defaultAssessments();
    Object.values(KEYS).forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        /* ignora */
      }
    });
  },
};
