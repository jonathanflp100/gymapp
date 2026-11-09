import { ExerciseGuideSheet } from '../../components/exercise/ExerciseGuideSheet';
import React, { useState, useEffect } from 'react';
import { Search, Plus, Dumbbell, Filter, X, Check, Save, PlayCircle, EyeOff, Eye, Settings2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useX } from '../../i18n/extraStrings';
import { available, isConfigured, saveInventory, useInventory } from '../../services/inventory';
import { EquipmentEditor } from '../../components/exercise/EquipmentEditor';
import { Sheet, useToast } from '../../components/common/ui';
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
  const [guide, setGuide] = useState<Exercise | null>(null);
  const [visible, setVisible] = useState(40);
  const x = useX();
  const { isOwner } = useAuth();
  const inv = useInventory();
  const [scope, setScope] = useState<'gym' | 'all' | 'hidden'>('gym');
  const [equipOpen, setEquipOpen] = useState(false);
  const [toast, showToast] = useToast();

  const shown = exercises.filter((ex) =>
    scope === 'all' ? true : scope === 'hidden' ? inv.hidden.includes(ex.id) : available(ex, inv)
  );

  const toggleHidden = async (ex: Exercise) => {
    const isHidden = inv.hidden.includes(ex.id);
    await saveInventory({ hidden: isHidden ? inv.hidden.filter((h) => h !== ex.id) : [...inv.hidden, ex.id] });
    showToast(isHidden ? x.inv.unhiddenToast : x.inv.hiddenToast);
  };

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
    setVisible(40);
    loadExercises();
  }, [searchQuery, selectedMuscle]);

  useEffect(() => setVisible(40), [scope]);

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
            {shown.length.toLocaleString(language)} {t("teacher.exerciseLibrarySubtitle")}
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

      {/* Equipamentos da academia */}
      {isOwner && !isConfigured(inv) ? (
        <button
          type="button"
          onClick={() => setEquipOpen(true)}
          className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-brand-primary-subtle border border-brand-primary/30 text-left"
        >
          <Settings2 className="w-5 h-5 text-brand-primary shrink-0" />
          <span className="flex-1">
            <span className="block text-sm font-black text-white">{x.inv.setupCta}</span>
            <span className="block text-[11px] text-slate-300">{x.inv.notSet}</span>
          </span>
        </button>
      ) : null}

      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none" role="tablist">
        {(
          [
            ['gym', x.inv.onlyGym],
            ['all', x.inv.fullCatalogue],
            ...(inv.hidden.length ? [['hidden', `${x.inv.hiddenTab} (${inv.hidden.length})`]] : []),
          ] as [typeof scope, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={scope === id}
            onClick={() => setScope(id)}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              scope === id ? 'bg-white text-slate-950 border-transparent' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
        {isOwner && isConfigured(inv) && (
          <button
            type="button"
            onClick={() => setEquipOpen(true)}
            aria-label={x.inv.title}
            className="ml-auto shrink-0 p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <Sheet open={equipOpen} onClose={() => setEquipOpen(false)} tall title={<h3 className="text-base font-black text-white">{x.inv.title}</h3>}>
        <p className="text-[11px] text-slate-400 mb-3">{x.inv.hint}</p>
        <EquipmentEditor
          canEdit={isOwner}
          onSaved={(m) => {
            showToast(m);
            setEquipOpen(false);
          }}
        />
      </Sheet>

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
        {shown.slice(0, visible).map((ex) => (
          <div key={ex.id} className="relative">
          <button
            type="button"
            onClick={() => setGuide(ex)}
            className={`w-full text-left bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex items-center gap-3.5 hover:border-slate-700 active:scale-[0.99] transition ${
              isOwner ? 'pr-14' : ''
            } ${scope === 'all' && !available(ex, inv) ? 'opacity-50' : ''}`}
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
            <PlayCircle className="w-5 h-5 text-brand-primary shrink-0" />
          </button>
          {isOwner && (
            <button
              type="button"
              onClick={() => toggleHidden(ex)}
              aria-label={inv.hidden.includes(ex.id) ? x.inv.unhide : x.inv.hide}
              title={inv.hidden.includes(ex.id) ? x.inv.unhide : x.inv.hide}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800"
            >
              {inv.hidden.includes(ex.id) ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          )}
          </div>
        ))}
      </div>
      {shown.length > visible && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + 40)}
          className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white"
        >
          {language === 'es-PY' ? 'Ver más' : 'Ver mais'} ({(shown.length - visible).toLocaleString(language)})
        </button>
      )}

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
      <ExerciseGuideSheet exercise={guide} onClose={() => setGuide(null)} />
      {toast}
    </div>
  );
};
