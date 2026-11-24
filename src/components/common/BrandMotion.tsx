import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import { useBrand } from '../../context/BrandContext';

/** Evento para mostrar a abertura de novo (ex.: depois de trocar a marca na /demo). */
export const SPLASH_EVENT = 'gymapp:splash';
const SPLASH_KEY = 'gymapp.splashShown';
export const triggerSplash = () => window.dispatchEvent(new Event(SPLASH_EVENT));

/** Vibra só depois de o usuário ter tocado na tela (senão o Chrome reclama no console). */
export const buzz = (pattern: number[]) => {
  try {
    const nav = navigator as Navigator & { userActivation?: { hasBeenActive: boolean } };
    if (nav.userActivation && !nav.userActivation.hasBeenActive) return;
    nav.vibrate?.(pattern);
  } catch {
    /* sem vibração */
  }
};

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Abertura do app com a logo e as cores da academia.
 * Aparece uma vez por sessão (abrir o app) e sempre que a marca muda na /demo.
 */
export const BrandSplash: React.FC = () => {
  const { brand, brandLogoUrl } = useBrand();
  const [phase, setPhase] = useState<'hidden' | 'in' | 'out'>(() => {
    if (typeof window === 'undefined' || reducedMotion()) return 'hidden';
    if ((navigator as Navigator & { webdriver?: boolean }).webdriver) return 'hidden';
    try {
      if (sessionStorage.getItem(SPLASH_KEY)) return 'hidden';
      sessionStorage.setItem(SPLASH_KEY, '1');
    } catch {
      /* sem storage */
    }
    return 'in';
  });

  useEffect(() => {
    const show = () => !reducedMotion() && setPhase('in');
    window.addEventListener(SPLASH_EVENT, show);
    return () => window.removeEventListener(SPLASH_EVENT, show);
  }, []);

  useEffect(() => {
    if (phase === 'in') {
      const t = setTimeout(() => setPhase('out'), 1500);
      return () => clearTimeout(t);
    }
    if (phase === 'out') {
      const t = setTimeout(() => setPhase('hidden'), 450);
      return () => clearTimeout(t);
    }
  }, [phase]);

  if (phase === 'hidden') return null;
  return (
    <div
      className={`fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden splash-bg ${phase === 'out' ? 'splash-out' : ''}`}
      onClick={() => setPhase('out')}
      aria-hidden="true"
    >
      <div className="splash-glow" />
      <div className="relative">
        <span className="splash-ring" />
        <span className="splash-ring splash-ring-2" />
        <img src={brandLogoUrl} alt="" className="splash-logo relative w-24 h-24 rounded-[28px] object-cover shadow-2xl" />
      </div>
      <h1 className="splash-name mt-6 text-2xl font-black tracking-tight text-white text-center px-6">{brand.name}</h1>
      {brand.tagline && <p className="splash-tag mt-1.5 text-sm text-white/70 text-center px-8">{brand.tagline}</p>}
      <div className="splash-bar mt-8" />
    </div>
  );
};

/** Check animado (traço desenhado + anel) usado no check-in. */
export const AnimatedCheck: React.FC<{ size?: number }> = ({ size = 88 }) => (
  <div className="relative mx-auto" style={{ width: size, height: size }}>
    <span className="check-burst" />
    <svg viewBox="0 0 52 52" width={size} height={size} className="relative">
      <circle className="check-circle" cx="26" cy="26" r="24" fill="none" />
      <path className="check-mark" fill="none" d="M15 27l7 7 15-16" />
    </svg>
  </div>
);

/** Tela cheia de "check-in feito", com vibração e confete nas cores da academia. */
export const CheckinSuccess: React.FC<{ text: string; onClose: () => void }> = ({ text, onClose }) => {
  const { brand } = useBrand();
  useEffect(() => {
    buzz([30, 40, 60]);
    if (!reducedMotion()) {
      try {
        confetti({ particleCount: 60, spread: 75, startVelocity: 32, origin: { y: 0.45 }, colors: [brand.primaryColor, '#10B981', '#FFFFFF'] });
      } catch {
        /* sem canvas */
      }
    }
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-6 animate-fadeIn" role="alertdialog" onClick={onClose}>
      <div className="bg-slate-900 border border-emerald-500/25 rounded-3xl p-7 text-center max-w-xs w-full animate-pop shadow-2xl">
        <AnimatedCheck />
        <p className="mt-4 text-base font-extrabold text-white" data-testid="checkin-result">
          {text}
        </p>
      </div>
    </div>,
    document.body
  );
};

/** Número que conta do zero até o valor (para destaques da tela). */
export const CountUp: React.FC<{ value: number; duration?: number; className?: string }> = ({ value, duration = 900, className }) => {
  const [shown, setShown] = useState(() => (reducedMotion() ? value : 0));
  useEffect(() => {
    if (reducedMotion()) return setShown(value);
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={className}>{shown}</span>;
};
