import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  Dumbbell,
  Users,
  Clock,
  X,
  Save,
  AlertCircle,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useBrand } from '../../context/BrandContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Routine, RoutineExercise, Exercise, Student, MuscleGroup } from '../../types';

interface RoutinesViewProps {
  initialCreateOpen?: boolean;
}

export const RoutinesView: React.FC<RoutinesViewProps> = ({ initialCreateOpen = false }) => {
  const { language, t } = useLanguage();
  const { brand } = useBrand();
  const { currentUser } = useAuth();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exercisesCatalog, setExercisesCatalog] = useState<Exercise[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Editor Modal State
  const [isModalOpen, setIsModalOpen] = useState(initialCreateOpen);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'A' | 'B' | 'C' | 'D' | 'FullBody'>('A');
  const [formDescription, setFormDescription] = useState('');
  const [formMuscles, setFormMuscles] = useState<MuscleGroup[]>(['chest', 'triceps']);
  const [formExercises, setFormExercises] = useState<RoutineExercise[]>([]);
  const [formStudentIds, setFormStudentIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    const [allRoutines, allExercises, allStudents] = await Promise.all([
      api.getRoutines(),
      api.getExercises(),
      api.getStudents(),
    ]);
    setRoutines(allRoutines);
    setExercisesCatalog(allExercises);
    setStudents(allStudents);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingRoutineId(null);
    setFormName('');
    setFormCategory('A');
    setFormDescription('');
    setFormMuscles(['chest', 'triceps']);
    setFormExercises([
      {
        id: `re-${Date.now()}-1`,
        exerciseId: exercisesCatalog[0]?.id || 'ex-bench-press',
        sets: 4,
        reps: '8-10',
        targetWeightKg: 40,
        restSeconds: 60,
        notes: '',
      },
    ]);
    setFormStudentIds([]);
    setIsModalOpen(true);
  };

  const openEditModal = (routine: Routine) => {
    setEditingRoutineId(routine.id);
    setFormName(routine.name);
    setFormCategory(routine.category as any);
    setFormDescription(routine.description || '');
    setFormMuscles(routine.targetMuscleGroups);
    setFormExercises([...routine.exercises]);
    setFormStudentIds([...routine.assignedStudentIds]);
    setIsModalOpen(true);
  };

  const handleAddExerciseToForm = () => {
    const newRe: RoutineExercise = {
      id: `re-${Date.now()}-${formExercises.length + 1}`,
      exerciseId: exercisesCatalog[0]?.id || 'ex-bench-press',
      sets: 3,
      reps: '10-12',
      targetWeightKg: 20,
      restSeconds: 60,
      notes: '',
    };
    setFormExercises([...formExercises, newRe]);
  };

  const handleRemoveExerciseFromForm = (index: number) => {
    setFormExercises(formExercises.filter((_, idx) => idx !== index));
  };

  const handleUpdateExerciseRow = (index: number, updates: Partial<RoutineExercise>) => {
    setFormExercises((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  };

  const toggleStudentSelection = (studentId: string) => {
    setFormStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSaveRoutine = async () => {
    if (!formName.trim()) {
      alert(t('teacher.pleaseEnterRoutineName'));
      return;
    }

    const payload = {
      id: editingRoutineId || undefined,
      name: formName,
      category: formCategory,
      description: formDescription,
      targetMuscleGroups: formMuscles,
      exercises: formExercises,
      createdById: currentUser?.id || 'teacher-1',
      assignedStudentIds: formStudentIds,
    };

    const saved = await api.saveRoutine(payload);

    // Also sync assigned routine to selected students
    if (formStudentIds.length > 0) {
      await api.assignRoutine(saved.id, formStudentIds);
    }

    await loadData();
    setIsModalOpen(false);
    setToastMessage(t('teacher.saveRoutineSuccess'));
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteRoutine = async (id: string) => {
    if (confirm(t('teacher.confirmDeleteRoutine'))) {
      await api.deleteRoutine(id);
      await loadData();
    }
  };

  const allMuscleOptions: MuscleGroup[] = [
    'chest',
    'back',
    'shoulders',
    'biceps',
    'triceps',
    'quadriceps',
    'hamstrings',
    'glutes',
    'calves',
    'abs',
  ];

  return (
    <div className="space-y-5 pb-28 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-4 right-4 z-50 max-w-sm mx-auto p-3.5 bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Title & Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">
            {t('teacher.routinesTitle')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('teacher.routinesSubtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="py-2.5 px-3.5 rounded-2xl bg-brand-primary hover:brightness-110 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>{t('teacher.createRoutine')}</span>
        </button>
      </div>

      {/* Routines Cards List */}
      <div className="space-y-4">
        {routines.map((routine) => {
          const assignedStudentsList = students.filter((s) =>
            routine.assignedStudentIds.includes(s.id)
          );

          return (
            <div
              key={routine.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-primary">
                    {t('teacher.division')} {routine.category}
                  </span>
                  <h3 className="text-lg font-black text-white mt-0.5">{routine.name}</h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(routine)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    aria-label="Editar ficha"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRoutine(routine.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                    aria-label="Excluir ficha"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {routine.description && (
                <p className="text-xs text-slate-400">{routine.description}</p>
              )}

              {/* Muscles Badges */}
              <div className="flex flex-wrap gap-1.5">
                {routine.targetMuscleGroups.map((mg) => (
                  <span
                    key={mg}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-950 text-slate-300 capitalize"
                  >
                    {t(`muscles.${mg}`)}
                  </span>
                ))}
              </div>

              {/* Exercises summary count & assigned students */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Dumbbell className="w-3.5 h-3.5 text-slate-500" />
                  <span>{routine.exercises.length} {t('nav.exercises').toLowerCase()}</span>
                </span>

                <span className="flex items-center gap-1 text-slate-300 font-semibold">
                  <Users className="w-3.5 h-3.5 text-brand-primary" />
                  <span>
                    {assignedStudentsList.length} {t('nav.students').toLowerCase()}
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT ROUTINE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl my-8 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-white">
                {editingRoutineId ? t('teacher.editRoutine') : t('teacher.createRoutine')}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              {/* Routine Name */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {t('teacher.routineNameLabel')} *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={t('teacher.routineNamePlaceholder')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary"
                />
              </div>

              {/* Category & Description */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {t('teacher.routineCategoryLabel')}
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="A">Treino A</option>
                    <option value="B">Treino B</option>
                    <option value="C">Treino C</option>
                    <option value="D">Treino D</option>
                    <option value="FullBody">Full Body</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Descrição / Objetivo
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Ex: Hipertrofia com foco em peito"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Exercises in Routine (Dynamic Editor) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Dumbbell className="w-4 h-4 text-brand-primary" />
                    <span>{t('teacher.exercisesInRoutine', { count: formExercises.length })}</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddExerciseToForm}
                    className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('teacher.addExerciseToRoutine')}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formExercises.map((re, idx) => (
                    <div
                      key={re.id}
                      className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-400">#{idx + 1}</span>
                        {/* Select Exercise from Library */}
                        <select
                          value={re.exerciseId}
                          onChange={(e) =>
                            handleUpdateExerciseRow(idx, { exerciseId: e.target.value })
                          }
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none"
                        >
                          {exercisesCatalog.map((ex) => (
                            <option key={ex.id} value={ex.id}>
                              {ex.name[language] || ex.name['pt-BR']} ({t(`muscles.${ex.muscleGroup}`)})
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => handleRemoveExerciseFromForm(idx)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Sets, Reps, Load, Rest row */}
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block mb-0.5">
                            {t('teacher.setsLabel')}
                          </span>
                          <input
                            type="number"
                            min="1"
                            value={re.sets}
                            onChange={(e) =>
                              handleUpdateExerciseRow(idx, { sets: parseInt(e.target.value) || 1 })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-center font-bold text-white"
                          />
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block mb-0.5">
                            {t('teacher.repsLabel')}
                          </span>
                          <input
                            type="text"
                            value={re.reps}
                            onChange={(e) => handleUpdateExerciseRow(idx, { reps: e.target.value })}
                            placeholder="8-12"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-center font-bold text-white"
                          />
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block mb-0.5">
                            Carga (kg)
                          </span>
                          <input
                            type="number"
                            value={re.targetWeightKg}
                            onChange={(e) =>
                              handleUpdateExerciseRow(idx, {
                                targetWeightKg: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-center font-bold text-white"
                          />
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block mb-0.5">
                            Descanso
                          </span>
                          <input
                            type="number"
                            value={re.restSeconds}
                            onChange={(e) =>
                              handleUpdateExerciseRow(idx, {
                                restSeconds: parseInt(e.target.value) || 60,
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-center font-bold text-white"
                          />
                        </div>
                      </div>

                      {/* Coach Notes */}
                      <input
                        type="text"
                        value={re.notes || ''}
                        onChange={(e) => handleUpdateExerciseRow(idx, { notes: e.target.value })}
                        placeholder={language === 'es-PY' ? 'Observaciones técnicas (opcional)...' : 'Observações técnicas (opcional)...'}
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-300 placeholder-slate-600"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Assign to Students checklist */}
              <div>
                <label className="text-xs font-bold text-white flex items-center gap-1.5 mb-2">
                  <Users className="w-4 h-4 text-brand-primary" />
                  <span>{t('teacher.assignToStudents')} ({formStudentIds.length} selecionados)</span>
                </label>

                <div className="max-h-36 overflow-y-auto space-y-1 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                  {students.map((st) => {
                    const isChecked = formStudentIds.includes(st.id);
                    return (
                      <div
                        key={st.id}
                        onClick={() => toggleStudentSelection(st.id)}
                        className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          isChecked
                            ? 'bg-brand-primary/10 border-brand-primary/40 text-white'
                            : 'border-slate-800/80 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-xs font-semibold">{st.name}</span>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                            isChecked
                              ? 'bg-brand-primary border-brand-primary text-white'
                              : 'border-slate-700'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveRoutine}
                className="w-full mt-4 py-3.5 px-4 rounded-2xl bg-brand-primary hover:brightness-110 active:scale-95 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition"
              >
                <Save className="w-4 h-4" />
                <span>{t('common.save')} Ficha</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
