import React, { useCallback, useEffect, useState } from 'react';
import { getCatalogueSteps, isCatalogueId } from '../../services/catalogue';
import { MovementAnimation, patternFor } from './MovementAnimation';
import { Play, Pause, Lightbulb, AlertTriangle, Timer, Dumbbell } from 'lucide-react';
import { Exercise } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import { useX } from '../../i18n/extraStrings';
import { useBrand } from '../../context/BrandContext';
import { EXERCISE_GUIDES } from '../../data/exerciseGuides';
import { Sheet } from '../common/ui';

/** Ficha do exercício: vídeo, passo a passo, dica, erro comum e músculos. */
export const ExerciseGuideSheet: React.FC<{ exercise: Exercise | null; onClose: () => void }> = ({ exercise, onClose }) => {
  const { language, t } = useLanguage();
  const x = useX();
  const es = language === 'es-PY';
  const guide = exercise ? EXERCISE_GUIDES[exercise.id] : undefined;
  const fallbackInstr = exercise?.instructions?.[es ? 'es-PY' : 'pt-BR'];
  const [catalogueSteps, setCatalogueSteps] = useState<string[]>([]);

  // Exercícios do catálogo completo: passo a passo carregado sob demanda
  useEffect(() => {
    setCatalogueSteps([]);
    if (!exercise || guide || !isCatalogueId(exercise.id)) return;
    let alive = true;
    getCatalogueSteps(exercise.id, language === 'es-PY' ? 'es-PY' : 'pt-BR').then((steps) => alive && setCatalogueSteps(steps));
    return () => {
      alive = false;
    };
  }, [exercise, guide, language]);
  const steps = guide ? (es ? guide.steps.es : guide.steps.pt) : catalogueSteps;

  return (
    <Sheet
      open={!!exercise}
      onClose={onClose}
      title={
        exercise && (
          <div className="min-w-0">
            <h3 className="text-base font-black text-white leading-tight">{exercise.name[es ? 'es-PY' : 'pt-BR']}</h3>
            <span className="text-[11px] text-slate-400">{x.guide.equipment[exercise.equipment]}</span>
          </div>
        )
      }
    >
      {exercise && (
        <div className="space-y-5">
          <VideoPlayer key={exercise.id} exercise={exercise} />

          <div className="flex flex-wrap gap-1.5">
            <Chip strong>
              {x.guide.primary}: {t(`muscles.${exercise.muscleGroup}`)}
            </Chip>
            {(exercise.secondaryMuscleGroups ?? []).map((m) => (
              <Chip key={m}>{t(`muscles.${m}`)}</Chip>
            ))}
            <Chip>
              <Timer className="w-3 h-3 inline -mt-0.5 mr-1" />
              {x.guide.rest}: {exercise.defaultRestSeconds}s
            </Chip>
          </div>

          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">{x.guide.howTo}</h4>
            {steps.length ? (
              <ol className="space-y-2">
                {steps.map((s, i) => (
                  <li key={i} className="flex gap-3 text-xs text-slate-200 leading-relaxed">
                    <span className="w-6 h-6 shrink-0 rounded-lg bg-brand-primary text-white font-black text-[11px] flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{s}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-slate-300">{fallbackInstr ?? '—'}</p>
            )}
          </div>

          {guide && (
            <div className="grid gap-2">
              <div className="flex gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400">{x.guide.tip}</div>
                  <p className="text-xs text-slate-200 mt-0.5">{es ? guide.tip.es : guide.tip.pt}</p>
                </div>
              </div>
              <div className="flex gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">{x.guide.mistakes}</div>
                  <p className="text-xs text-slate-200 mt-0.5">{es ? guide.avoid.es : guide.avoid.pt}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
};

const Chip: React.FC<{ children: React.ReactNode; strong?: boolean }> = ({ children, strong }) => (
  <span
    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
      strong ? 'bg-brand-primary-subtle border-transparent text-brand-primary' : 'bg-slate-950 border-slate-800 text-slate-300'
    }`}
  >
    {children}
  </span>
);

/**
 * Se a academia tiver vídeo próprio do exercício (videoUrl), toca o vídeo.
 * Senão mostra a animação de cadência do movimento, sem aviso de vídeo.
 */
const VideoPlayer: React.FC<{ exercise: Exercise }> = ({ exercise }) => {
  const { brand } = useBrand();
  const x = useX();
  const url = EXERCISE_GUIDES[exercise.id]?.videoUrl;
  const [playing, setPlaying] = useState(true);
  const [reps, setReps] = useState(0);

  const countRep = useCallback(() => setReps((r) => r + 1), []);
  const isHold = (exercise.pattern ?? patternFor(exercise.id, exercise.muscleGroup)) === 'plank';

  if (url) {
    return <video src={url} controls playsInline className="w-full aspect-video rounded-2xl bg-black" />;
  }

  return (
    <div
      className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10"
      style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.secondaryColor || '#0f172a'})` }}
    >
      <div className="absolute inset-0 bg-slate-950/45" />
      <div className="absolute inset-x-0 top-6 bottom-6 flex items-center justify-center">
        <MovementAnimation
          exerciseId={exercise.id}
          muscleGroup={exercise.muscleGroup}
          patternOverride={exercise.pattern}
          playing={playing}
          accent={brand.primaryColor}
          onRep={countRep}
        />
      </div>

      <div className="absolute top-3 left-3 flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-black/40 text-white flex items-center gap-1">
          <Dumbbell className="w-3 h-3" />
          {x.guide.video}
        </span>
      </div>
      {!isHold && (
        <div className="absolute top-3 right-3 text-[11px] font-black px-2 py-1 rounded-lg bg-black/40 text-white tabular-nums">
          {reps} reps
        </div>
      )}

      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? 'Pausar' : 'Play'}
        className={`absolute inset-0 flex items-center justify-center ${playing ? 'opacity-0 hover:opacity-100' : ''} transition`}
      >
        <span className="w-14 h-14 rounded-full bg-white/95 text-slate-900 flex items-center justify-center shadow-2xl">
          {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
        </span>
      </button>

      <div className="absolute bottom-0 inset-x-0 px-3 py-2 bg-gradient-to-t from-black/70 to-transparent">
        <div className="text-[11px] font-bold text-white">{isHold ? x.guide.hold : x.guide.tempo}</div>
      </div>
    </div>
  );
};
