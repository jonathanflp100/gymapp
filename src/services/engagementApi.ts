/**
 * Mural de avisos, check-in por QR code e desafios do mês.
 * Modo completo: servidor da academia (hub). Demo: dados de exemplo no aparelho.
 */
import type { Announcement, Challenge, CheckinStats } from '../types';
import { REAL_BACKEND } from './openGymBackend';
import { hub } from './hub';
import { MOCK_STUDENTS } from '../data/mockData';
import { DEMO_TEXT_ES } from '../data/demoLocaleEs';
import { localDay } from './extrasApi';

const K = { ann: 'gymapp_demo_announcements', chk: 'gymapp_demo_checkins', ch: 'gymapp_demo_challenges' };

const isEs = () => {
  try {
    return localStorage.getItem('gymapp_preferred_language') === 'es-PY';
  } catch {
    return false;
  }
};
function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function save(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* ignora */
  }
}
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const month = () => localDay().slice(0, 7);
const wait = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 100));

function seedAnnouncements(): Announcement[] {
  const es = isEs();
  const next = new Date(Date.now() + 9 * 86_400_000);
  const nextDay = next.toLocaleDateString(es ? 'es-PY' : 'pt-BR', { day: '2-digit', month: '2-digit' });
  return [
    {
      id: 'av-1',
      title: es ? '¡Nuevo horario los sábados!' : 'Novo horário aos sábados!',
      body: es
        ? 'A partir de este sábado abrimos de 7:00 a 14:00. ¡Aprovechá la clase de Zumba a las 9:00!'
        : 'A partir deste sábado abrimos das 7h às 14h. Aproveite a aula de Zumba às 9h!',
      kind: 'info',
      pinned: true,
      expiresAt: null,
      authorName: es ? 'Recepción' : 'Recepção',
      createdAt: daysAgo(1),
    },
    {
      id: 'av-2',
      title: es ? 'Traé un amigo y ganá un mes' : 'Traga um amigo e ganhe um mês',
      body: es
        ? 'Cada amigo que se inscriba con tu nombre te da un mes gratis. Válido hasta fin de mes.'
        : 'Cada amigo que se matricular com seu nome vale um mês grátis para você. Válido até o fim do mês.',
      kind: 'promo',
      pinned: false,
      expiresAt: null,
      authorName: es ? 'Administración' : 'Administração',
      createdAt: daysAgo(3),
    },
    {
      id: 'av-3',
      title: es ? `Feriado ${nextDay}: cerramos a las 12:00` : `Feriado ${nextDay}: fechamos às 12h`,
      body: es ? 'Planificá tu entrenamiento. ¡Buen feriado!' : 'Programe seu treino. Bom feriado!',
      kind: 'alert',
      pinned: false,
      expiresAt: null,
      authorName: es ? 'Recepción' : 'Recepção',
      createdAt: daysAgo(5),
    },
  ];
}

function seedChallenges(): Omit<Challenge, 'progress' | 'done'>[] {
  const m = month();
  return [
    {
      id: 'ds-1',
      title: { 'pt-BR': '20 treinos no mês', 'es-PY': '20 entrenos en el mes' },
      reward: { 'pt-BR': 'Squeeze da academia', 'es-PY': 'Botella del gimnasio' },
      metric: 'workouts',
      target: 20,
      month: m,
      createdAt: daysAgo(8),
    },
    {
      id: 'ds-2',
      title: { 'pt-BR': '12 check-ins', 'es-PY': '12 check-ins' },
      reward: { 'pt-BR': '10% de desconto na renovação', 'es-PY': '10% de descuento en la renovación' },
      metric: 'checkins',
      target: 12,
      month: m,
      createdAt: daysAgo(8),
    },
    {
      id: 'ds-3',
      title: { 'pt-BR': '4 aulas coletivas', 'es-PY': '4 clases grupales' },
      reward: { 'pt-BR': 'Camiseta exclusiva', 'es-PY': 'Remera exclusiva' },
      metric: 'classes',
      target: 4,
      month: m,
      createdAt: daysAgo(8),
    },
  ];
}

const DEMO_PROGRESS: Record<string, number> = { workouts: 13, checkins: 9, classes: 4 };

const demo = {
  async announcements(): Promise<Announcement[]> {
    const stored = load<Announcement[]>(K.ann);
    const list = stored ?? seedAnnouncements();
    return wait([...list].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt)));
  },
  async postAnnouncement(a: Pick<Announcement, 'title' | 'body' | 'kind' | 'pinned' | 'expiresAt'>): Promise<Announcement> {
    const list = load<Announcement[]>(K.ann) ?? seedAnnouncements();
    const item: Announcement = { ...a, id: `av-${Date.now()}`, authorName: isEs() ? 'Entrenador' : 'Professor', createdAt: new Date().toISOString() };
    save(K.ann, [item, ...list]);
    return wait(item);
  },
  async deleteAnnouncement(id: string) {
    save(K.ann, (load<Announcement[]>(K.ann) ?? seedAnnouncements()).filter((a) => a.id !== id));
  },

  async checkinCode() {
    const stats = await this.checkinStats();
    return { code: 'DEMO', date: localDay(), count: stats.days[stats.days.length - 1].count };
  },
  async checkin(_code: string) {
    const state = load<{ date: string; at: string }>(K.chk);
    if (state?.date === localDay()) return wait({ ok: true, already: true, at: state.at });
    const at = new Date().toISOString();
    save(K.chk, { date: localDay(), at });
    return wait({ ok: true, already: false, at });
  },
  async checkedInToday(): Promise<string | null> {
    const state = load<{ date: string; at: string }>(K.chk);
    return state?.date === localDay() ? state.at : null;
  },
  async checkinStats(): Promise<CheckinStats> {
    const es = isEs();
    const counts = [38, 44, 41, 29, 47, 52, 0];
    const days = counts.map((c, i) => ({ date: localDay(Date.now() - (6 - i) * 86_400_000), count: c }));
    const today = MOCK_STUDENTS.slice(0, 7).map((s, i) => ({
      id: s.id,
      name: es ? DEMO_TEXT_ES[s.name] ?? s.name : s.name,
      at: new Date(Date.now() - (i * 23 + 5) * 60_000).toISOString(),
    }));
    days[6].count = today.length;
    return wait({ days, today });
  },

  async challenges(staffView = false): Promise<Challenge[]> {
    const list = (load<Omit<Challenge, 'progress' | 'done'>[]>(K.ch) ?? seedChallenges()).filter((c) => c.month >= month());
    return wait(
      list.map((c) => {
        const progress = Math.min(DEMO_PROGRESS[c.metric] ?? 0, c.target);
        const out: Challenge = { ...c, progress, done: progress >= c.target };
        if (staffView) {
          out.participants = 34;
          out.completedBy = MOCK_STUDENTS.slice(0, c.metric === 'classes' ? 6 : 2).map((s) => ({ id: s.id, name: s.name }));
        }
        return out;
      })
    );
  },
  async createChallenge(c: Pick<Challenge, 'title' | 'reward' | 'metric' | 'target' | 'month'>) {
    const list = load<Omit<Challenge, 'progress' | 'done'>[]>(K.ch) ?? seedChallenges();
    const item = { ...c, id: `ds-${Date.now()}`, createdAt: new Date().toISOString() };
    save(K.ch, [...list, item]);
    return wait({ ...item, progress: 0, done: false } as Challenge);
  },
  async deleteChallenge(id: string) {
    save(K.ch, (load<Omit<Challenge, 'progress' | 'done'>[]>(K.ch) ?? seedChallenges()).filter((c) => c.id !== id));
  },
};

const real: typeof demo = {
  announcements: () => hub.announcements(),
  postAnnouncement: (a) => hub.postAnnouncement(a),
  deleteAnnouncement: async (id) => {
    await hub.deleteAnnouncement(id);
  },
  checkinCode: () => hub.checkinCode(),
  checkin: (code) => hub.checkin(code),
  async checkedInToday() {
    try {
      const days = await hub.checkins('');
      return days.find((d) => d.date === localDay())?.at ?? null;
    } catch {
      return null;
    }
  },
  checkinStats: () => hub.checkinStats(),
  challenges: () => hub.challenges(),
  createChallenge: (c) => hub.createChallenge(c),
  deleteChallenge: async (id) => {
    await hub.deleteChallenge(id);
  },
};

export const engagement = REAL_BACKEND ? real : demo;

/** Endereço que o QR code da recepção abre. */
export const checkinUrl = (code: string) => `${window.location.origin}/?checkin=${encodeURIComponent(code)}`;
