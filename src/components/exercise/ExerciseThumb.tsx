import React from 'react';
import { illustrationFor } from '../../data/exerciseIllustrations';
import { ILLUSTRATION_BG } from './ExerciseIllustration';

/** Miniatura do exercício (pose de contração) que abre o guia. Some quando não há ilustração. */
export const ExerciseThumb: React.FC<{ exerciseId: string; onClick?: () => void; size?: number }> = ({ exerciseId, onClick, size = 56 }) => {
  const art = illustrationFor(exerciseId);
  if (!art) return null;
  const style = { width: size, height: size, backgroundColor: ILLUSTRATION_BG };
  const img = <img src={art.peak || art.start} alt="" loading="lazy" draggable={false} className="w-full h-full object-cover scale-110" />;
  const cls = 'shrink-0 rounded-2xl overflow-hidden border border-white/10 shadow-lg block';
  // dentro de outro botão (lista) vira só imagem, para não aninhar botões
  if (!onClick) return <span className={cls} style={style} aria-hidden="true">{img}</span>;
  return (
    <button type="button" onClick={onClick} aria-hidden="true" tabIndex={-1} className={`press ${cls}`} style={style}>
      {img}
    </button>
  );
};
