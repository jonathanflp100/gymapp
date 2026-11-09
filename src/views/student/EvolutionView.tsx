import React, { useState, useEffect } from 'react';
import { Activity, Dumbbell, Scale, Flame, ClipboardCheck, History as HistoryIcon } from 'lucide-react';
import { useX } from '../../i18n/extraStrings';
import { AssessmentPanel } from '../../components/assessment/AssessmentPanel';
import { HistoryView } from './HistoryView';
import { WeightLogButton } from '../../components/engagement/WeightLogSheet';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/api';
import {
  WeightRecord,
  PersonalRecord,
  Exercise,
  MuscleGroup,
  MuscleFatigueScore,
  Student,
} from '../../types';
import { MuscleMap } from '../../components/muscle/MuscleMap';
import { EvolutionCharts } from '../../components/charts/EvolutionCharts';

export const EvolutionView: React.FC<{ initialTab?: 'metrics' | 'muscles' | 'assessment' | 'history' }> = ({ initialTab }) => {
  const { currentUser, refreshUser } = useAuth();
  const { t } = useLanguage();

  const student = currentUser as Student;

  const gx = useX();
  const [activeTab, setActiveTab] = useState<'metrics' | 'muscles' | 'assessment' | 'history'>(initialTab ?? 'metrics');
  const [weightHistory, setWeightHistory] = useState<WeightRecord[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [stimulusData, setStimulusData] = useState<Record<MuscleGroup, MuscleFatigueScore> | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function loadEvolution() {
      if (!student) return;
      try {
        const [weights, prs, allExercises, muscleScores] = await Promise.all([
          api.getWeightHistory(student.id),
          api.getPersonalRecords(student.id),
          api.getExercises(),
          api.getWeeklyMuscleStimulus(student.id),
        ]);

        setWeightHistory(weights);
        setPersonalRecords(prs);
        setExercises(allExercises);
        setStimulusData(muscleScores);
      } catch (err) {
        console.error('Error loading evolution data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadEvolution();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id, reloadKey]);

  return (
    <div className="space-y-5 pb-28 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">
          {t('evolution.title')}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {t('evolution.subtitle')}
        </p>
      </div>

      {/* View Switcher Tabs */}
      <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
        {(
          [
            ['metrics', gx.evo.progress, Scale],
            ['muscles', gx.evo.muscles, Activity],
            ['assessment', gx.evo.assessment, ClipboardCheck],
            ['history', gx.evo.history, HistoryIcon],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`py-2 px-1 rounded-xl text-[11px] font-bold transition flex flex-col items-center justify-center gap-1 ${
              activeTab === id ? 'bg-brand-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="truncate max-w-full">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'metrics' && student && (
        <WeightLogButton
          studentId={student.id}
          currentKg={weightHistory[weightHistory.length - 1]?.weightKg ?? student.currentWeightKg ?? 0}
          targetKg={student.targetWeightKg || 0}
          onSaved={() => {
            setReloadKey((k) => k + 1);
            refreshUser();
          }}
        />
      )}
      {activeTab === 'metrics' && (
        <EvolutionCharts
          weightHistory={weightHistory}
          personalRecords={personalRecords}
          exercises={exercises}
          targetWeightKg={student?.targetWeightKg || 0}
        />
      )}
      {activeTab === 'muscles' && stimulusData && <MuscleMap stimulusData={stimulusData} />}
      {activeTab === 'assessment' && student && <AssessmentPanel studentId={student.id} />}
      {activeTab === 'history' && <HistoryView embedded />}
    </div>
  );
};
