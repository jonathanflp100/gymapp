/**
 * Equipamentos da academia: o dono marca o que a academia tem e a biblioteca e o
 * seletor de exercícios passam a mostrar só o que dá para fazer lá.
 * Demo: guardado no navegador. Modo completo: servidor da academia (/api/hub/inventory).
 */
import { useEffect, useState } from 'react';
import type { Exercise } from '../types';
import { hub } from './hub';
import { REAL_BACKEND } from './openGymBackend';

export const KITS = [
  'barbell',
  'smith',
  'dumbbell',
  'kettlebell',
  'cable',
  'machine',
  'band',
  'suspension',
  'ball',
  'plate',
  'cardio',
  'mobility',
  'bodyweight',
  'other',
] as const;
export type Kit = (typeof KITS)[number];

export interface Inventory {
  /** null = a academia ainda não configurou: mostra o catálogo inteiro */
  kits: string[] | null;
  hidden: string[];
}

const KEY = 'gymapp.inventory';
let state: Inventory = { kits: null, hidden: [] };
let loaded: Promise<Inventory> | null = null;
const listeners = new Set<(i: Inventory) => void>();

const emit = () => listeners.forEach((l) => l(state));

/** Grupo de equipamento de um exercício (os cadastrados pela academia usam o equipamento simples). */
export const kitOf = (ex: Exercise): string => ex.kit ?? ex.equipment;

export function loadInventory(): Promise<Inventory> {
  if (!loaded) {
    loaded = (async () => {
      try {
        if (REAL_BACKEND) state = await hub.inventory();
        else {
          const raw = localStorage.getItem(KEY);
          if (raw) state = JSON.parse(raw);
        }
      } catch {
        /* sem acesso (aluno) ou sem storage: catálogo inteiro */
      }
      emit();
      return state;
    })();
  }
  return loaded;
}

export async function saveInventory(next: Partial<Inventory>): Promise<Inventory> {
  const merged: Inventory = { ...state, ...next };
  if (REAL_BACKEND) state = await hub.saveInventory(merged);
  else {
    state = merged;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* sem storage */
    }
  }
  loaded = Promise.resolve(state);
  emit();
  return state;
}

export const isConfigured = (inv: Inventory) => inv.kits !== null || inv.hidden.length > 0;

/** O exercício existe na academia? (curados pela academia sempre contam, a não ser que estejam ocultos) */
export function available(ex: Exercise, inv: Inventory): boolean {
  if (inv.hidden.includes(ex.id)) return false;
  if (ex.source !== 'catalogue' || !inv.kits) return true;
  return inv.kits.includes(kitOf(ex));
}

export function useInventory(): Inventory {
  const [inv, setInv] = useState<Inventory>(state);
  useEffect(() => {
    listeners.add(setInv);
    loadInventory().then(setInv);
    return () => {
      listeners.delete(setInv);
    };
  }, []);
  return inv;
}
