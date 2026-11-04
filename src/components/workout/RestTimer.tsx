import React, { useEffect, useState } from 'react';
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

  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [totalTime, setTotalTime] = useState(initialSeconds);

  useEffect(() => {
    setTimeLeft(initialSeconds);
    setTotalTime(initialSeconds);
    setIsRunning(true);
  }, [initialSeconds]);

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
    if (!isOpen || !isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          playAlertSound();
          if (onFinish) onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isRunning, timeLeft, onFinish]);

  if (!isOpen) return null;

  const progressPercent = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${String(seconds).padStart(2, '0')}`;

  const handleAdd15 = () => {
    setTimeLeft((prev) => prev + 15);
    setTotalTime((prev) => prev + 15);
  };

  const handleMinus15 = () => {
    setTimeLeft((prev) => Math.max(0, prev - 15));
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
            onClick={() => setIsRunning(!isRunning)}
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
