import React, { useState, useEffect } from 'react';
import { Activity, Dumbbell, Scale, Flame } from 'lucide-react';
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

export const EvolutionView: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const student = currentUser as Student;

  const [activeTab, setActiveTab] = useState<'metrics' | 'muscles'>('metrics');
  const [weightHistory, setWeightHistory] = useState<WeightRecord[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [stimulusData, setStimulusData] = useState<Record<MuscleGroup, MuscleFatigueScore> | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

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
  }, [student]);

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
      <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'metrics'
              ? 'bg-brand-primary text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>{t('evolution.tabWeight')} & PRs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('muscles')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'muscles'
              ? 'bg-brand-primary text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>{t('evolution.tabMuscles')}</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'metrics' ? (
        <EvolutionCharts
          weightHistory={weightHistory}
          personalRecords={personalRecords}
          exercises={exercises}
          targetWeightKg={student?.targetWeightKg || 0}
        />
      ) : (
        stimulusData && <MuscleMap stimulusData={stimulusData} />
      )}
    </div>
  );
};
