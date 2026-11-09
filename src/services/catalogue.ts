/**
 * Catálogo completo de exercícios (dados do openGym em public/catalogo/, ver LICENCA.txt).
 * Carregado sob demanda: o índice (~120 KB) na primeira busca, as instruções por lote ao abrir um exercício.
 */
import type { Exercise, MuscleGroup } from '../types';

type Row = [string, string, string, MuscleGroup, Exercise['equipment'], string, MuscleGroup[], string?];

let cache: Exercise[] | null = null;
let loading: Promise<Exercise[]> | null = null;
const byId = new Map<string, Exercise>();

export const CATALOGUE_PREFIX = 'og-';
export const isCatalogueId = (id: string) => id.startsWith(CATALOGUE_PREFIX);

const REST: Record<MuscleGroup, number> = {
  chest: 90, back: 90, shoulders: 75, biceps: 60, triceps: 60,
  quadriceps: 120, hamstrings: 90, glutes: 90, calves: 45, abs: 45,
};

export function loadCatalogue(): Promise<Exercise[]> {
  if (cache) return Promise.resolve(cache);
  if (!loading) {
    loading = fetch('/catalogo/indice.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Row[]) => {
        cache = rows.map(([id, pt, es, muscle, equipment, pattern, secondary, kit]) => {
          const ex: Exercise = {
            id: CATALOGUE_PREFIX + id,
            name: { 'pt-BR': pt, 'es-PY': es },
            muscleGroup: muscle,
            secondaryMuscleGroups: secondary,
            equipment,
            defaultRestSeconds: REST[muscle] ?? 60,
            pattern,
            kit: kit ?? equipment,
            source: 'catalogue',
          };
          byId.set(ex.id, ex);
          return ex;
        });
        return cache;
      })
      .catch(() => {
        loading = null;
        return [];
      });
  }
  return loading;
}

export const catalogueSize = () => cache?.length ?? 0;
export const getCatalogueExercise = (id: string) => byId.get(id) ?? null;

const stepCache = new Map<number, Record<string, { pt: string[]; es: string[] }>>();

/** Passo a passo de um exercício do catálogo no idioma pedido. */
export async function getCatalogueSteps(id: string, lang: 'pt-BR' | 'es-PY'): Promise<string[]> {
  const raw = id.replace(CATALOGUE_PREFIX, '');
  const bucket = Math.floor(parseInt(raw, 10) / 200);
  if (!stepCache.has(bucket)) {
    try {
      const r = await fetch(`/catalogo/instrucoes/${bucket}.json`);
      stepCache.set(bucket, r.ok ? await r.json() : {});
    } catch {
      return [];
    }
  }
  const entry = stepCache.get(bucket)?.[raw];
  if (!entry) return [];
  return lang === 'es-PY' ? entry.es : entry.pt;
}

/** Busca sem acentos, por todas as palavras. */
export function matches(ex: Exercise, query: string): boolean {
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const hay = norm(`${ex.name['pt-BR']} ${ex.name['es-PY']}`);
  return norm(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

/** Junta os exercícios da academia (curados) com o catálogo e aplica os filtros. */
export async function searchExercises(
  curated: Exercise[],
  filter?: { muscleGroup?: MuscleGroup; query?: string }
): Promise<Exercise[]> {
  const all = [...curated.map((e) => ({ ...e, source: e.source ?? ('curated' as const) })), ...(await loadCatalogue())];
  let result = all;
  if (filter?.muscleGroup) {
    const m = filter.muscleGroup;
    result = result.filter((ex) => ex.muscleGroup === m || (ex.source === 'curated' && ex.secondaryMuscleGroups?.includes(m)));
  }
  if (filter?.query?.trim()) result = result.filter((ex) => matches(ex, filter.query!));
  return result;
}
