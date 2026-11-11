/**
 * Treino sem internet:
 *  - o treino em andamento fica salvo no aparelho (se o app fechar, continua de onde parou);
 *  - se a internet cair na hora de salvar, o treino entra numa fila e é enviado quando voltar.
 */
import { useEffect, useState } from 'react';
import type { WorkoutHistoryEntry } from '../types';
import { api } from './api';

const QUEUE_KEY = 'gymapp.pendingWorkouts';
const ACTIVE_KEY = 'gymapp.activeWorkout';
const listeners = new Set<(n: number) => void>();

type Pending = Omit<WorkoutHistoryEntry, 'id'>;

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* sem storage */
  }
};

export const pendingCount = () => read<Pending[]>(QUEUE_KEY, []).length;
const emit = () => listeners.forEach((l) => l(pendingCount()));

/** Erro de rede (sem internet / servidor fora), e não erro de validação. */
const isNetworkError = (e: unknown) =>
  !navigator.onLine || e instanceof TypeError || /network|fetch|Failed to fetch|Load failed/i.test(String((e as Error)?.message ?? e));

/** Salva o treino; sem internet, guarda na fila e devolve o resumo para a comemoração. */
export async function finishWorkoutSafe(data: Pending): Promise<WorkoutHistoryEntry & { pending?: boolean }> {
  try {
    const saved = await api.finishWorkout(data);
    void flushPending();
    return saved;
  } catch (e) {
    if (!isNetworkError(e)) throw e;
    write(QUEUE_KEY, [...read<Pending[]>(QUEUE_KEY, []), data]);
    emit();
    return { ...data, id: `pending-${Date.now()}`, pending: true };
  }
}

let flushing = false;
export async function flushPending(): Promise<number> {
  if (flushing || !navigator.onLine) return 0;
  const queue = read<Pending[]>(QUEUE_KEY, []);
  if (!queue.length) return 0;
  flushing = true;
  let sent = 0;
  try {
    while (queue.length) {
      await api.finishWorkout(queue[0]);
      queue.shift();
      sent++;
      write(QUEUE_KEY, queue.length ? queue : null);
    }
  } catch {
    /* tenta de novo na próxima conexão */
  } finally {
    flushing = false;
    emit();
  }
  return sent;
}

export function usePendingWorkouts(): number {
  const [n, setN] = useState(pendingCount);
  useEffect(() => {
    listeners.add(setN);
    setN(pendingCount());
    return () => {
      listeners.delete(setN);
    };
  }, []);
  return n;
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}

// ------------------------------------------------------------------ treino em andamento

export interface SavedActiveWorkout<T> {
  userId: string;
  routineId?: string;
  routineName: string;
  startedAt: string;
  exercises: T[];
}

export const saveActiveWorkout = <T,>(w: SavedActiveWorkout<T> | null) => write(ACTIVE_KEY, w);
export const loadActiveWorkout = <T,>(userId: string): SavedActiveWorkout<T> | null => {
  const w = read<SavedActiveWorkout<T> | null>(ACTIVE_KEY, null);
  // descarta treino de outra pessoa ou esquecido há mais de 12 horas
  if (!w || w.userId !== userId || Date.now() - Date.parse(w.startedAt) > 12 * 3600_000) return null;
  return w;
};

// ------------------------------------------------------------------ tela acesa

/** Mantém a tela acesa enquanto `on` for verdadeiro (se o navegador permitir). */
export function useWakeLock(on: boolean): boolean {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!on || !('wakeLock' in navigator)) return;
    let lock: { release: () => Promise<void> } | null = null;
    let cancelled = false;
    const request = async () => {
      try {
        lock = await (navigator as unknown as { wakeLock: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock.request('screen');
        if (cancelled) void lock.release();
        else setActive(true);
      } catch {
        setActive(false);
      }
    };
    void request();
    // o navegador solta a trava quando o app vai para o fundo: pede de novo ao voltar
    const onVisible = () => document.visibilityState === 'visible' && void request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release().catch(() => undefined);
      setActive(false);
    };
  }, [on]);
  return active;
}

// Envia a fila assim que a internet volta, em qualquer tela, e também ao abrir o app.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void flushPending());
  setTimeout(() => void flushPending(), 3000);
}
