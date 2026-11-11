import React, { useEffect, useMemo, useState } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { Exercise, MuscleGroup } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import { Sheet } from '../common/ui';
import { matches } from '../../services/catalogue';
import { available, isConfigured, useInventory } from '../../services/inventory';
import { useX } from '../../i18n/extraStrings';

const MUSCLES: (MuscleGroup | 'all')[] = ['all', 'chest', 'back', 'shoulders', 'biceps', 'triceps', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'abs'];
const PAGE = 40;

/** Botão que mostra o exercício escolhido e abre a busca no catálogo completo. */
export const ExercisePicker: React.FC<{
  value: string;
  exercises: Exercise[];
  onChange: (id: string) => void;
  /** texto quando nada está escolhido */
  placeholder?: string;
  /** controle externo (ex.: troca de exercício durante o treino, sem botão) */
  open?: boolean;
  onClose?: () => void;
  initialMuscle?: MuscleGroup;
}> = ({ value, exercises, onChange, placeholder, open: openProp, onClose, initialMuscle }) => {
  const { language, t } = useLanguage();
  const [openState, setOpenState] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : openState;
  const setOpen = (v: boolean) => (controlled ? !v && onClose?.() : setOpenState(v));
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | 'all'>(initialMuscle ?? 'all');
  useEffect(() => {
    if (open && initialMuscle) setMuscle(initialMuscle);
  }, [open, initialMuscle]);
  const [limit, setLimit] = useState(PAGE);
  const current = exercises.find((e) => e.id === value);
  const name = (e: Exercise) => e.name[language] || e.name['pt-BR'];
  const es = language === 'es-PY';
  const x = useX();
  const inv = useInventory();
  const [onlyGym, setOnlyGym] = useState(true);
  const filtering = onlyGym && isConfigured(inv);

  useEffect(() => setLimit(PAGE), [query, muscle, onlyGym]);

  const results = useMemo(() => {
    let list = filtering ? exercises.filter((e) => available(e, inv)) : exercises;
    if (muscle !== 'all') list = list.filter((e) => e.muscleGroup === muscle);
    if (query.trim()) list = list.filter((e) => matches(e, query));
    return list;
  }, [exercises, query, muscle, filtering, inv]);

  return (
    <>
      {!controlled && (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold flex items-center justify-between gap-2 text-left"
      >
        <span className="truncate">
          {current
            ? `${name(current)} (${t(`muscles.${current.muscleGroup}`)})`
            : placeholder ?? (es ? 'Elegir ejercicio' : 'Escolher exercício')}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        tall
        title={
          <div>
            <h3 className="text-base font-black text-white">{es ? 'Elegir ejercicio' : 'Escolher exercício'}</h3>
            <span className="text-[11px] text-slate-400">
              {results.length.toLocaleString(language)} {es ? 'ejercicios' : 'exercícios'}
            </span>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={es ? 'Buscar: press, sentadilla, remo...' : 'Buscar: supino, agachamento, remada...'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {MUSCLES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMuscle(m)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border ${
                  muscle === m ? 'bg-brand-primary border-transparent text-white' : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                {m === 'all' ? (es ? 'Todos' : 'Todos') : t(`muscles.${m}`)}
              </button>
            ))}
          </div>
          {isConfigured(inv) && (
            <button
              type="button"
              onClick={() => setOnlyGym((v) => !v)}
              className="text-[11px] font-bold text-brand-primary underline underline-offset-2"
            >
              {onlyGym ? x.inv.pickerAll : x.inv.pickerGym}
            </button>
          )}
          <div className="space-y-1">
            {results.slice(0, limit).map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => {
                  onChange(e.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl border flex items-center gap-2 ${
                  e.id === value ? 'bg-brand-primary-subtle border-brand-primary/40' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-white truncate">{name(e)}</span>
                  <span className="block text-[10px] text-slate-500">
                    {t(`muscles.${e.muscleGroup}`)}
                    {e.source !== 'catalogue' && <span className="ml-1.5 text-brand-primary font-bold">★</span>}
                  </span>
                </span>
                {e.id === value && <Check className="w-4 h-4 text-brand-primary" />}
              </button>
            ))}
            {results.length > limit && (
              <button
                type="button"
                onClick={() => setLimit((l) => l + PAGE)}
                className="w-full py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-white"
              >
                {es ? 'Ver más' : 'Ver mais'} ({(results.length - limit).toLocaleString(language)})
              </button>
            )}
          </div>
        </div>
      </Sheet>
    </>
  );
};
