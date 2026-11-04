import React, { useState, useEffect } from 'react';
import { Search, Plus, Dumbbell, Filter, X, Check, Save } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useBrand } from '../../context/BrandContext';
import { api } from '../../services/api';
import { Exercise, MuscleGroup } from '../../types';

export const ExerciseLibraryView: React.FC = () => {
  const { language, t } = useLanguage();
  const { brand } = useBrand();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'all'>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New exercise form fields
  const [newPtName, setNewPtName] = useState('');
  const [newEsName, setNewEsName] = useState('');
  const [newMuscle, setNewMuscle] = useState<MuscleGroup>('chest');
  const [newEquipment, setNewEquipment] = useState<'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight'>('dumbbell');
  const [newRestSec, setNewRestSec] = useState(60);

  const loadExercises = async () => {
    const list = await api.getExercises({
      muscleGroup: selectedMuscle === 'all' ? undefined : selectedMuscle,
      query: searchQuery || undefined,
    });
    setExercises(list);
  };

  useEffect(() => {
    loadExercises();
  }, [searchQuery, selectedMuscle]);

  const handleCreateExercise = async () => {
    if (!newPtName.trim()) {
      alert('Informe o nome do exercício');
      return;
    }

    await api.createExercise({
      name: {
        'pt-BR': newPtName,
        'es-PY': newEsName || newPtName,
      },
      muscleGroup: newMuscle,
      equipment: newEquipment,
      defaultRestSeconds: newRestSec,
    });

    setIsNewModalOpen(false);
    setNewPtName('');
    setNewEsName('');
    await loadExercises();
  };

  const muscleFilterTabs: (MuscleGroup | 'all')[] = [
    'all',
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
      {/* Title & Add Exercise */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">
            {t('teacher.exerciseLibraryTitle')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {exercises.length} {t('teacher.exerciseLibrarySubtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewModalOpen(true)}
          className="py-2.5 px-3.5 rounded-2xl bg-brand-primary hover:brightness-110 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>{t('teacher.addCustomExercise')}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('teacher.searchExercises')}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary transition"
        />
      </div>

      {/* Muscle Filter Scrollable Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {muscleFilterTabs.map((m) => {
          const isSelected = selectedMuscle === m;
          const label = m === 'all' ? t('common.all') : t(`muscles.${m}`);

          return (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedMuscle(m)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition capitalize ${
                isSelected
                  ? 'bg-brand-primary text-white shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Exercise Cards List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {exercises.map((ex) => (
          <div
            key={ex.id}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex items-center gap-3.5 hover:border-slate-700 transition"
          >
            {/* Visual Icon Badge */}
            <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-brand-primary shrink-0">
              <Dumbbell className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 capitalize block">
                {t(`muscles.${ex.muscleGroup}`)} · {t(`equipment.${ex.equipment}`)}
              </span>
              <h3 className="text-sm font-black text-white truncate mt-0.5">
                {ex.name[language] || ex.name['pt-BR']}
              </h3>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {t('teacher.defaultRestLabel', { sec: ex.defaultRestSeconds })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* NEW EXERCISE MODAL */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white">
                {t('teacher.addCustomExercise')}
              </h3>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {t('teacher.exerciseNamePt')} *
                </label>
                <input
                  type="text"
                  value={newPtName}
                  onChange={(e) => setNewPtName(e.target.value)}
                  placeholder="Ex: Supino Inclinado com Halteres"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {t('teacher.exerciseNameEs')} (Opcional)
                </label>
                <input
                  type="text"
                  value={newEsName}
                  onChange={(e) => setNewEsName(e.target.value)}
                  placeholder="Ej: Press Inclinado con Mancuernas"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {t('teacher.selectMuscleGroup')}
                  </label>
                  <select
                    value={newMuscle}
                    onChange={(e) => setNewMuscle(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white capitalize focus:outline-none"
                  >
                    {muscleFilterTabs.filter((m) => m !== 'all').map((m) => (
                      <option key={m} value={m}>
                        {t(`muscles.${m as MuscleGroup}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {t('teacher.equipmentType')}
                  </label>
                  <select
                    value={newEquipment}
                    onChange={(e) => setNewEquipment(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white capitalize focus:outline-none"
                  >
                    <option value="barbell">{t('equipment.barbell')}</option>
                    <option value="dumbbell">{t('equipment.dumbbell')}</option>
                    <option value="cable">{t('equipment.cable')}</option>
                    <option value="machine">{t('equipment.machine')}</option>
                    <option value="bodyweight">{t('equipment.bodyweight')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Descanso Padrão (segundos)
                </label>
                <input
                  type="number"
                  value={newRestSec}
                  onChange={(e) => setNewRestSec(parseInt(e.target.value) || 60)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleCreateExercise}
                className="w-full mt-3 py-3 px-4 rounded-2xl bg-brand-primary hover:brightness-110 active:scale-95 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition"
              >
                <Save className="w-4 h-4" />
                <span>{t('teacher.saveExercise')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
