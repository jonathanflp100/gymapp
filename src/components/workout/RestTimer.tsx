import React, { useEffect, useRef, useState } from 'react';
import { buzz } from '../common/BrandMotion';
import { Play, Pause, SkipForward, Plus, Minus, Bell } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useBrand } from '../../context/BrandContext';

interface RestTimerProps {
  initialSeconds: number;
  onFinish?: () => void;
  onSkip?: () => void;
  isOpen: boolean;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  initialSeconds,
  onFinish,
  onSkip,
  isOpen,
}) => {
  const { t } = useLanguage();
  const { brand } = useBrand();

  // O tempo é calculado pelo relógio (horário de término), não por contagem de ticks:
  // assim não trava quando a tela re-renderiza (o cronômetro do treino atualiza a cada segundo)
  // e continua certo se o celular bloquear a tela no meio do descanso.
  const [endAt, setEndAt] = useState(() => Date.now() + initialSeconds * 1000);
  const [pausedLeft, setPausedLeft] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState(initialSeconds);
  const [, setTick] = useState(0);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const finishedRef = useRef(false);

  useEffect(() => {
    setEndAt(Date.now() + initialSeconds * 1000);
    setPausedLeft(null);
    setTotalTime(initialSeconds);
    finishedRef.current = false;
  }, [initialSeconds, isOpen]);

  const isRunning = pausedLeft === null;
  const msLeft = isRunning ? Math.max(0, endAt - Date.now()) : pausedLeft;
  const timeLeft = Math.ceil(msLeft / 1000);
  // Audio beep generator using Web Audio API (no external sound file needed)
  const playAlertSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio might be blocked if user hasn't interacted
    }
  };

  useEffect(() => {
    if (!isOpen || !isRunning) return;
    const interval = setInterval(() => {
      setTick((n) => n + 1);
      if (!finishedRef.current && Date.now() >= endAt) {
        finishedRef.current = true;
        playAlertSound();
        buzz([200, 100, 200]);
        // mostra "descanso concluído" por um instante antes de fechar
        setTimeout(() => onFinishRef.current?.(), 1500);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [isOpen, isRunning, endAt]);

  if (!isOpen) return null;

  const progressPercent = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${String(seconds).padStart(2, '0')}`;

  const shift = (sec: number) => {
    if (finishedRef.current && sec < 0) return;
    finishedRef.current = false;
    if (isRunning) setEndAt((e) => Math.max(Date.now(), e + sec * 1000));
    else setPausedLeft((p) => Math.max(0, (p ?? 0) + sec * 1000));
    if (sec > 0) setTotalTime((t) => t + sec);
  };
  const handleAdd15 = () => shift(15);
  const handleMinus15 = () => shift(-15);
  const togglePause = () => {
    if (isRunning) setPausedLeft(Math.max(0, endAt - Date.now()));
    else {
      setEndAt(Date.now() + (pausedLeft ?? 0));
      setPausedLeft(null);
    }
  };

  return (
    <div className="fixed bottom-24 left-4 right-4 z-40 max-w-md mx-auto">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-3xl p-4 shadow-2xl flex items-center justify-between gap-3 text-white">
        {/* Circular Progress & Time Display */}
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
              {/* Background Circle */}
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Animated Progress Circle */}
              <path
                stroke={brand.primaryColor}
                strokeDasharray={`${progressPercent}, 100`}
                strokeLinecap="round"
                strokeWidth="3.5"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute font-mono font-bold text-sm tracking-tight">{formattedTime}</span>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-brand-primary" />
              <span>{t('workout.restTimerTitle')}</span>
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              {timeLeft > 0 ? `${timeLeft} ${t('common.sec')}` : t('workout.restFinished')}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleMinus15}
            aria-label="Diminuir 15 segundos de descanso"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95 transition"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleAdd15}
            aria-label="Adicionar 15 segundos de descanso"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={togglePause}
            aria-label={isRunning ? 'Pausar descanso' : 'Retomar descanso'}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 transition"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          <button
            type="button"
            onClick={onSkip}
            aria-label="Pular descanso"
            className="px-2.5 h-9 flex items-center justify-center gap-1 rounded-xl bg-brand-primary font-bold text-xs text-white shadow-md active:scale-95 transition"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{t('workout.skipRest')}</span>
          </button>

          <button
            type="button"
            onClick={onSkip}
            aria-label="Fechar timer"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white"
          >
            <span className="text-base font-bold leading-none">×</span>
          </button>
        </div>
      </div>
    </div>
  );
};
