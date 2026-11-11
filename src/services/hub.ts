/**
 * Cliente do servidor da academia (server/hub). Usado só no modo completo.
 */
import type { Announcement, BodyAssessment, BrandConfig, Challenge, CheckinStats, GroupClass, MonthReport, Routine, WorkoutHistoryEntry } from '../types';
import type { ClassOccurrence } from './extrasApi';

export type HubRole = 'owner' | 'teacher' | 'student';

export interface HubMember {
  id: string;
  name: string;
  role: HubRole;
  plan: string;
  status: 'active' | 'inactive';
  joinedAt: string;
  lastSeen?: string;
  heightCm?: number;
  targetWeightKg?: number;
  gender?: 'M' | 'F' | 'O';
  notes?: string;
  stats: { workouts30: number; totalWorkouts: number; streak: number; lastWorkoutAt: string | null };
}

export interface HubStats {
  students: number;
  active7: number;
  atRisk: { id: string; name: string; lastWorkoutAt: string | null; joinedAt: string }[];
  workouts7: number;
  checkinsToday?: number;
  classesToday: number;
  bookedToday: number;
  capacityToday: number;
}

export interface Ranking {
  month: string;
  rows: { position: number; id: string; name: string; days: number; isMe: boolean }[];
  me: { position: number; days: number; total: number } | null;
}

export interface ProgressPhoto {
  id: string;
  date: string;
  studentId: string;
  url: string;
}

export class HubError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/hub${path}`, {
    method,
    credentials: 'include',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* sem corpo */
  }
  if (!res.ok) throw new HubError(res.status, data?.error || `Erro ${res.status}`);
  return data as T;
}

const q = (o: Record<string, string>) => `?${new URLSearchParams(o).toString()}`;

export const hub = {
  settings: () => call<BrandConfig>('GET', '/settings'),
  saveSettings: (s: Partial<BrandConfig>) => call<BrandConfig>('PUT', '/settings', s),

  me: () => call<{ user: { id: string; name: string }; member: HubMember; hasOwner: boolean }>('GET', '/me'),
  claim: (code: string) => call<{ member: HubMember }>('POST', '/claim', { code }),

  members: () => call<HubMember[]>('GET', '/members'),
  member: (id: string) => call<HubMember>('GET', `/members/${encodeURIComponent(id)}`),
  updateMember: (id: string, data: Partial<HubMember>) => call<HubMember>('PUT', `/members/${encodeURIComponent(id)}`, data),

  routines: () => call<Routine[]>('GET', '/routines'),
  saveRoutine: (r: Partial<Routine>) => call<Routine>('PUT', '/routines', r),
  deleteRoutine: (id: string) => call('DELETE', `/routines/${encodeURIComponent(id)}`),
  assign: (id: string, studentIds: string[]) => call<Routine>('POST', `/routines/${encodeURIComponent(id)}/assign`, { studentIds }),

  classes: (date: string) => call<ClassOccurrence[]>('GET', `/classes${q({ date })}`),
  myClasses: () => call<ClassOccurrence[]>('GET', '/classes/mine'),
  createClass: (c: Omit<GroupClass, 'id'> & { teacherName?: string }) => call<GroupClass>('POST', '/classes', c),
  deleteClass: (id: string) => call('DELETE', `/classes/${encodeURIComponent(id)}`),
  attendees: (id: string, date: string) =>
    call<{ id: string; name: string }[]>('GET', `/classes/${encodeURIComponent(id)}/attendees${q({ date })}`),
  book: (classId: string, date: string) => call<{ ok: boolean; reason?: 'full' }>('POST', '/bookings', { classId, date }),
  cancel: (classId: string, date: string) => call('DELETE', `/bookings${q({ classId, date })}`),

  assessments: (studentId: string) => call<BodyAssessment[]>('GET', `/assessments${q({ studentId })}`),
  saveAssessment: (a: Omit<BodyAssessment, 'id' | 'teacherId'>) => call<BodyAssessment>('POST', '/assessments', a),

  postActivity: (w: WorkoutHistoryEntry) => call('POST', '/activity', w),
  updateActivity: (w: WorkoutHistoryEntry) => call('PUT', `/activity/${encodeURIComponent(w.id)}`, w),
  deleteActivity: (id: string) => call('DELETE', `/activity/${encodeURIComponent(id)}`),
  activity: (studentId: string) => call<WorkoutHistoryEntry[]>('GET', `/activity${q({ studentId })}`),

  ranking: () => call<Ranking>('GET', '/ranking'),
  stats: () => call<HubStats>('GET', '/stats'),

  announcements: () => call<Announcement[]>('GET', '/announcements'),
  postAnnouncement: (a: Pick<Announcement, 'title' | 'body' | 'kind' | 'pinned' | 'expiresAt'>) =>
    call<Announcement>('POST', '/announcements', a),
  deleteAnnouncement: (id: string) => call('DELETE', `/announcements/${encodeURIComponent(id)}`),

  checkinCode: () => call<{ code: string; date: string; count: number }>('GET', '/checkin/code'),
  checkin: (code: string) => call<{ ok: boolean; already: boolean; at: string }>('POST', '/checkin', { code }),
  checkins: (studentId: string) => call<{ date: string; at: string }[]>('GET', `/checkins${q({ studentId })}`),
  checkinStats: () => call<CheckinStats>('GET', '/checkins/stats'),

  pushKey: () => call<{ publicKey: string }>('GET', '/push/key'),
  pushSubscribe: (subscription: PushSubscriptionJSON) => call<{ ok: boolean }>('POST', '/push/subscribe', { subscription }),
  pushUnsubscribe: (endpoint: string) => call<{ ok: boolean }>('POST', '/push/unsubscribe', { endpoint }),
  pushTest: () => call<{ sent: number }>('POST', '/push/test', {}),

  report: (month: string) => call<MonthReport>('GET', `/report${q({ month })}`),

  photos: (studentId = '') => call<ProgressPhoto[]>('GET', `/photos${q({ studentId })}`),
  addPhoto: (data: string, date: string) => call<ProgressPhoto>('POST', '/photos', { data, date }),
  deletePhoto: (id: string) => call<{ ok: boolean }>('DELETE', `/photos/${encodeURIComponent(id)}`),

  inventory: () => call<{ kits: string[] | null; hidden: string[] }>('GET', '/inventory'),
  saveInventory: (inv: { kits?: string[] | null; hidden?: string[] }) =>
    call<{ kits: string[] | null; hidden: string[] }>('PUT', '/inventory', inv),

  challenges: () => call<Challenge[]>('GET', '/challenges'),
  createChallenge: (c: Pick<Challenge, 'title' | 'reward' | 'metric' | 'target' | 'month'>) => call<Challenge>('POST', '/challenges', c),
  deleteChallenge: (id: string) => call('DELETE', `/challenges/${encodeURIComponent(id)}`),
};
