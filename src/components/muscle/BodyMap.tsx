/**
 * Mapa do corpo (frente e costas) com os músculos acesos pela intensidade.
 * Desenho próprio do GymApp: cada músculo é um caminho do lado esquerdo, espelhado para o direito.
 */
import React, { useEffect, useState } from 'react';
import type { MuscleGroup, Routine } from '../../types';
import { api } from '../../services/api';
import { useBrand } from '../../context/BrandContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useX } from '../../i18n/extraStrings';

export type Level = 'none' | 'light' | 'moderate' | 'high';
export type Levels = Partial<Record<MuscleGroup, Level>>;

const BASE = {
  head: 'M50 4 a11 12 0 1 0 0.01 0 Z',
  neck: 'M45 26 L55 26 L56 34 L44 34 Z',
  torso: 'M29 36 Q50 30 71 36 L74 58 Q71 88 66 108 L34 108 Q29 88 26 58 Z',
  pelvis: 'M34 106 L66 106 L68 122 Q50 131 32 122 Z',
};
// lado esquerdo do corpo (é espelhado)
const LIMBS = [
  'M27 38 Q18 42 17 58 L15 84 L24 86 L28 60 Z', // braço
  'M15 86 L11 116 L18 118 L24 88 Z', // antebraço
  'M10 118 Q8 126 12 130 L18 128 L18 118 Z', // mão
  'M33 120 Q29 150 33 172 L47 172 Q50 148 49 124 Z', // coxa
  'M34 174 Q32 192 35 208 L45 208 Q48 190 46 174 Z', // perna
  'M34 208 L46 208 L47 214 L30 214 Z', // pé
];

type Shape = { m: MuscleGroup; d: string; center?: boolean };

const FRONT: Shape[] = [
  { m: 'shoulders', d: 'M29 37 Q19 40 18 53 Q24 50 31 45 Z' },
  { m: 'chest', d: 'M49 41 L49 62 Q40 67 31 61 Q28 51 31 44 Q40 39 49 41 Z' },
  { m: 'biceps', d: 'M19 56 Q17 67 17 80 L24 81 Q27 69 27 58 Z' },
  { m: 'abs', d: 'M42 66 L49 66 L49 104 L42 104 Q40 85 42 66 Z' },
  { m: 'abs', d: 'M33 66 L40 68 Q38 86 40 104 L35 104 Q31 86 33 66 Z' },
  { m: 'quadriceps', d: 'M34 125 Q31 148 35 168 L45 168 Q48 147 48 127 Z' },
  { m: 'calves', d: 'M35 177 Q34 191 37 204 L41 204 Q42 190 41 177 Z' },
];
const BACK: Shape[] = [
  { m: 'back', d: 'M41 30 Q50 27 59 30 L63 40 L50 54 L37 40 Z', center: true },
  { m: 'shoulders', d: 'M29 37 Q19 40 18 53 Q24 50 31 45 Z' },
  { m: 'back', d: 'M31 46 Q29 70 37 93 L49 98 L49 56 Q40 53 31 46 Z' },
  { m: 'triceps', d: 'M19 54 Q16 67 17 80 L24 81 Q27 67 27 56 Z' },
  { m: 'glutes', d: 'M34 108 Q30 120 34 129 Q43 134 49 129 L49 108 Z' },
  { m: 'hamstrings', d: 'M34 133 Q32 151 35 168 L45 168 Q48 151 48 135 Z' },
  { m: 'calves', d: 'M35 174 Q31 186 35 199 L45 199 Q48 186 46 174 Z' },
];

const OPACITY: Record<Level, number> = { none: 0, light: 0.4, moderate: 0.7, high: 1 };

const Figure: React.FC<{ shapes: Shape[]; levels: Levels; color: string; label: string; height: number; caption: boolean }> = ({
  shapes,
  levels,
  color,
  label,
  height,
  caption,
}) => {
  const fillFor = (m: MuscleGroup) => {
    const l = levels[m] ?? 'none';
    return l === 'none' ? '#334155' : color;
  };
  const opacityFor = (m: MuscleGroup) => {
    const l = levels[m] ?? 'none';
    return l === 'none' ? 0.55 : OPACITY[l];
  };
  return (
    <figure className="flex flex-col items-center m-0">
      <svg viewBox="0 0 100 218" height={height} role="img" aria-label={label}>
        <g fill="#1e293b">
          {Object.values(BASE).map((d) => (
            <path key={d} d={d} />
          ))}
          {LIMBS.map((d) => (
            <g key={d}>
              <path d={d} />
              <path d={d} transform="translate(100 0) scale(-1 1)" />
            </g>
          ))}
        </g>
        {shapes.map((s, i) => (
          <g key={i} fill={fillFor(s.m)} fillOpacity={opacityFor(s.m)} data-muscle={s.m} data-level={levels[s.m] ?? 'none'}>
            <path d={s.d} />
            {!s.center && <path d={s.d} transform="translate(100 0) scale(-1 1)" />}
          </g>
        ))}
      </svg>
      {caption && <figcaption className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">{label}</figcaption>}
    </figure>
  );
};

export const BodyMap: React.FC<{ levels: Levels; height?: number; legend?: boolean }> = ({ levels, height = 190, legend = false }) => {
  const caption = height >= 100;
  const { brand } = useBrand();
  const x = useX();
  const color = brand.primaryColor || '#DC2626';
  return (
    <div>
      <div className={`flex justify-center ${height < 100 ? 'gap-1' : 'gap-6'}`}>
        <Figure shapes={FRONT} levels={levels} color={color} label={x.pro.front} height={height} caption={caption} />
        <Figure shapes={BACK} levels={levels} color={color} label={x.pro.back} height={height} caption={caption} />
      </div>
      {legend && (
        <div className="flex justify-center gap-3 mt-3">
          {(['light', 'moderate', 'high'] as const).map((l) => (
            <span key={l} className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color, opacity: OPACITY[l] }} />
              {x.pro.bodyLegend[l]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

/** Músculos principais do treino ficam fortes; os secundários, moderados. */
export function levelsFromMuscles(primary: MuscleGroup[], secondary: MuscleGroup[] = []): Levels {
  const out: Levels = {};
  for (const m of secondary) out[m] = 'moderate';
  for (const m of primary) out[m] = 'high';
  return out;
}

/** Lista de músculos com os nomes traduzidos (para leitores de tela e legenda). */
export const MuscleChips: React.FC<{ muscles: MuscleGroup[] }> = ({ muscles }) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {muscles.map((m) => (
        <span key={m} className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-950 text-slate-300">
          {t(`muscles.${m}`)}
        </span>
      ))}
    </div>
  );
};

/**
 * Músculos de uma ficha: os marcados pelo professor ou, se ele não marcou nenhum,
 * os músculos principais dos exercícios da ficha.
 */
export function useRoutineMuscles(routine: Routine | null | undefined): MuscleGroup[] {
  const [derived, setDerived] = useState<MuscleGroup[]>([]);
  const marked = routine?.targetMuscleGroups ?? [];
  const ids = routine?.exercises.map((e) => e.exerciseId).join(',') ?? '';
  useEffect(() => {
    if (!routine || marked.length) return;
    let alive = true;
    Promise.all(routine.exercises.map((e) => api.getExerciseById(e.exerciseId).catch(() => null))).then((list) => {
      if (alive) setDerived(Array.from(new Set(list.filter(Boolean).map((e) => e!.muscleGroup))));
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routine?.id, ids, marked.length]);
  return marked.length ? marked : derived;
}
