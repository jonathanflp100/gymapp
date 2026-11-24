import React, { useEffect, useRef } from 'react';
import type { Illustration } from '../../data/exerciseIllustrations';

/** Fundo das ilustrações (azul bem claro), para o quadro não ter emenda. */
export const ILLUSTRATION_BG = '#D7F0FD';

/**
 * Ilustração do exercício com as duas poses (início e contração) alternando suavemente,
 * no ritmo de uma repetição a cada 4 s. Isometrias mostram a pose única "respirando".
 */
export const ExerciseIllustration: React.FC<{
  art: Illustration;
  playing?: boolean;
  onRep?: () => void;
  className?: string;
}> = ({ art, playing = true, onRep, className = '' }) => {
  const peakRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = peakRef.current;
    if (!el || !onRep) return;
    const h = () => onRep();
    el.addEventListener('animationiteration', h);
    return () => el.removeEventListener('animationiteration', h);
  }, [onRep]);

  const state = { animationPlayState: playing ? 'running' : 'paused' } as React.CSSProperties;
  return (
    <div className={`relative w-full h-full ${className}`} style={{ backgroundColor: ILLUSTRATION_BG }}>
      <img src={art.start} alt="" draggable={false} className={`absolute inset-0 w-full h-full object-contain select-none ${art.peak ? '' : 'illus-breathe'}`} style={art.peak ? undefined : state} />
      {art.peak && (
        <img ref={peakRef} src={art.peak} alt="" draggable={false} className="absolute inset-0 w-full h-full object-contain select-none illus-peak" style={state} />
      )}
    </div>
  );
};
