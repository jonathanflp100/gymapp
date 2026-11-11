/**
 * Relatório do mês. Modo completo: calculado no servidor da academia.
 * Demo: números de exemplo coerentes com os alunos da demonstração.
 */
import type { MonthReport } from '../types';
import { hub } from './hub';
import { REAL_BACKEND } from './openGymBackend';
import { api } from './api';
import { extrasApi, localDay } from './extrasApi';
import { engagement } from './engagementApi';

async function demoReport(month: string): Promise<MonthReport> {
  const students = await api.getStudents();
  const active = students.filter((s) => s.status !== 'inactive');
  const DAY = 86_400_000;
  const since = (d?: string) => (d ? Math.floor((Date.now() - Date.parse(`${d}T12:00:00`)) / DAY) : null);
  const top = [...active]
    .map((s, i) => ({ name: s.name, days: Math.max(4, 18 - i * 2 - (since(s.lastWorkoutDate) ?? 10) / 3) | 0 }))
    .sort((a, b) => b.days - a.days)
    .slice(0, 5);
  // mesma regra do cartão "alunos sumidos" do painel
  const atRisk = students
    .map((s) => ({ name: s.name, days: since(s.lastWorkoutDate) }))
    .filter((x) => x.days === null || x.days >= 7)
    .sort((a, b) => (b.days ?? 999) - (a.days ?? 999));
  const occ = await extrasApi.getClassesForDate(localDay()).catch(() => []);
  const challenges = await engagement.challenges(true).catch(() => []);
  return {
    month,
    activeStudents: 186,
    totalStudents: 203,
    newStudents: 14,
    trainedMonth: 151,
    totalWorkouts: 1342,
    checkins: 1518,
    busiestWeekday: 1,
    topStudents: top,
    atRisk,
    classes: occ
      .map((o, i) => ({ name: o.cls.name, bookings: 38 - i * 6 + o.booked }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5),
    challenges: challenges.map((c) => ({ title: c.title, done: c.completedBy?.length ?? 0 })),
  };
}

export const reportApi = {
  get: (month: string): Promise<MonthReport> => (REAL_BACKEND ? hub.report(month) : demoReport(month)),
};
