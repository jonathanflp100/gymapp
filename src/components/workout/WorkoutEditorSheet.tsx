import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Check, X } from 'lucide-react';
import type { Exercise, SetLog, Student, WorkoutHistoryEntry } from '../../types';
import { api, recount } from '../../services/api';
import { localDay } from '../../services/extrasApi';
import { useLanguage } from '../../i18n/LanguageContext';
import { useX } from '../../i18n/extraStrings';
import { Sheet } from '../common/ui';
import { ExercisePicker } from '../exercise/ExercisePicker';

type Draft = Omit<WorkoutHistoryEntry, 'id'> & { id?: string };

const field = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary';
const small = 'w-full bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1.5 text-center text-sm font-bold text-white';

/** Corrige um treino já salvo ou registra um treino feito no papel. */
export const WorkoutEditorSheet: React.FC<{
  open: boolean;
  entry: WorkoutHistoryEntry | null; // null = treino novo (feito no papel)
  student: Student;
  onClose: () => void;
  onSaved: (msg: string) => void;
}> = ({ open, entry, student, onClose, onSaved }) => {
  const x = useX();
  const { language, t } = useLanguage();
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [day, setDay] = useState(localDay());
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (open && !catalog.length) api.getExercises().then(setCatalog);
  }, [open, catalog.length]);

  useEffect(() => {
    if (!open) return;
    if (entry) {
      setDraft(structuredClone(entry));
      setDay(localDay(Date.parse(entry.startedAt)));
    } else {
      setDraft({
        studentId: student.id,
        routineName: '',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMinutes: 60,
        totalVolumeKg: 0,
        totalSets: 0,
        muscleGroups: [],
        exercises: [],
        manual: true,
      });
      setDay(localDay());
    }
  }, [open, entry, student.id]);

  if (!draft) return null;
  const nameOf = (id: string) => {
    const e = catalog.find((c) => c.id === id);
    return e ? e.name[language] || e.name['pt-BR'] : id;
  };
  const setEx = (i: number, sets: SetLog[]) =>
    setDraft({ ...draft, exercises: draft.exercises.map((e, j) => (j === i ? { ...e, sets } : e)) });

  const save = async () => {
    setBusy(true);
    try {
      // mantém o horário original e troca só o dia
      const startOld = new Date(draft.startedAt);
      const [y, m, d] = day.split('-').map(Number);
      const start = new Date(y, m - 1, d, startOld.getHours() || 18, startOld.getMinutes());
      const end = new Date(start.getTime() + Math.max(1, draft.durationMinutes) * 60_000);
      const muscles = Array.from(new Set(draft.exercises.map((e) => catalog.find((c) => c.id === e.exerciseId)?.muscleGroup).filter(Boolean)));
      const data = recount({
        ...draft,
        routineName: draft.routineName.trim() || t('workout.customWorkoutName'),
        startedAt: start.toISOString(),
        completedAt: end.toISOString(),
        muscleGroups: (muscles.length ? muscles : draft.muscleGroups) as Draft['muscleGroups'],
        exercises: draft.exercises.map((e) => ({ ...e, exerciseName: nameOf(e.exerciseId) })),
      });
      if (draft.id) await api.updateWorkout(data as WorkoutHistoryEntry);
      else await api.finishWorkout(data);
      onSaved(x.pro.workoutSaved);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!draft.id || !confirm(x.pro.confirmDelete)) return;
    await api.deleteWorkout(draft.id);
    onSaved(x.pro.workoutDeleted);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      tall
      title={<h3 className="text-base font-black text-white">{entry ? x.pro.editWorkout : x.pro.logManual}</h3>}
    >
      <div className="space-y-3" data-testid="workout-editor">
        <div>
          <label htmlFor="we-name" className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
            {x.pro.routine}
          </label>
          <input id="we-name" className={field} value={draft.routineName} onChange={(e) => setDraft({ ...draft, routineName: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="we-date" className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
              {x.pro.date}
            </label>
            <input id="we-date" type="date" max={localDay()} className={field} value={day} onChange={(e) => setDay(e.target.value)} />
          </div>
          <div>
            <label htmlFor="we-dur" className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
              {x.pro.duration}
            </label>
            <input
              id="we-dur"
              type="number"
              min={1}
              className={field}
              value={draft.durationMinutes}
              onChange={(e) => setDraft({ ...draft, durationMinutes: Math.max(1, parseInt(e.target.value) || 1) })}
            />
          </div>
        </div>

        {draft.exercises.map((ex, i) => (
          <div key={i} className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-white truncate">{nameOf(ex.exerciseId)}</span>
              <button
                type="button"
                aria-label={x.engage.remove}
                onClick={() => setDraft({ ...draft, exercises: draft.exercises.filter((_, j) => j !== i) })}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {ex.sets.map((s, k) => (
              <div key={k} className="grid grid-cols-12 gap-1.5 items-center">
                <span className="col-span-2 text-center text-[10px] font-bold text-slate-500">
                  {s.type === 'warmup' ? x.pro.warmupSet : s.type === 'drop' ? x.pro.dropSet : `#${s.setNumber}`}
                </span>
                <div className="col-span-4 flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    aria-label="kg"
                    className={small}
                    value={s.weightKg}
                    onChange={(e) => setEx(i, ex.sets.map((z, j) => (j === k ? { ...z, weightKg: Math.max(0, parseFloat(e.target.value) || 0) } : z)))}
                  />
                  <span className="text-[10px] text-slate-500">kg</span>
                </div>
                <div className="col-span-3 flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    aria-label="reps"
                    className={small}
                    value={s.reps}
                    onChange={(e) => setEx(i, ex.sets.map((z, j) => (j === k ? { ...z, reps: Math.max(0, parseInt(e.target.value) || 0) } : z)))}
                  />
                </div>
                <button
                  type="button"
                  aria-label="✓"
                  onClick={() => setEx(i, ex.sets.map((z, j) => (j === k ? { ...z, completed: !z.completed } : z)))}
                  className={`col-span-2 h-8 rounded-lg flex items-center justify-center ${s.completed ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label={t('workout.removeSet')}
                  onClick={() => setEx(i, ex.sets.filter((_, j) => j !== k))}
                  className="col-span-1 text-slate-600 hover:text-red-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const last = ex.sets[ex.sets.length - 1];
                const n = ex.sets.filter((z) => (z.type ?? 'work') === 'work').length + 1;
                setEx(i, [...ex.sets, { setNumber: n, weightKg: last?.weightKg ?? 20, reps: last?.reps ?? 10, completed: true, type: 'work' }]);
              }}
              className="text-xs font-bold text-slate-300 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 text-brand-primary" />
              {t('workout.addSet')}
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 text-sm font-bold text-slate-300 flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4 text-brand-primary" />
          {x.pro.addExercise}
        </button>
        {adding && (
          <ExercisePicker
            open
            onClose={() => setAdding(false)}
            value=""
            exercises={catalog}
            onChange={(id) => {
              setDraft({
                ...draft,
                exercises: [
                  ...draft.exercises,
                  {
                    exerciseId: id,
                    exerciseName: nameOf(id),
                    sets: [1, 2, 3].map((n) => ({ setNumber: n, weightKg: 20, reps: 10, completed: true, type: 'work' as const })),
                  },
                ],
              });
              setAdding(false);
            }}
          />
        )}

        <button
          type="button"
          disabled={busy || !draft.exercises.length}
          onClick={save}
          className="w-full py-3 rounded-2xl bg-brand-primary text-white text-sm font-black disabled:opacity-40"
        >
          {x.pro.saveWorkout}
        </button>
        {draft.id && (
          <button type="button" onClick={remove} className="w-full py-2.5 rounded-xl text-sm font-bold text-red-400 bg-red-500/10">
            {x.pro.deleteWorkout}
          </button>
        )}
      </div>
    </Sheet>
  );
};
