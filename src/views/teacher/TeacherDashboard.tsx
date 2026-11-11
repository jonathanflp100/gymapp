import { TodayClassesCard } from '../../components/common/ClassWidgets';
import { AtRiskCard } from '../../components/common/RetentionWidgets';
import { EngagementCard } from '../../components/engagement/EngagementCard';
import { MonthReportCard } from '../../components/report/MonthReport';
import React, { useState, useEffect } from 'react';
import { Users, ClipboardList, Library, Dumbbell, Calendar, Clock, ChevronRight, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useBrand } from '../../context/BrandContext';
import { api } from '../../services/api';
import { Student, Routine, Teacher } from '../../types';

interface TeacherDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenCreateRoutine: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onNavigateTab,
  onOpenCreateRoutine,
}) => {
  const { currentUser } = useAuth();
  const { t, formatDate } = useLanguage();
  const { brand } = useBrand();

  const teacher = currentUser as Teacher;

  const [students, setStudents] = useState<Student[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exercisesCount, setExercisesCount] = useState(40);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [allStudents, allRoutines, allExercises] = await Promise.all([
          api.getStudents(),
          api.getRoutines(),
          api.getExercises(),
        ]);
        setStudents(allStudents);
        setRoutines(allRoutines);
        setExercisesCount(allExercises.length);
      } catch (err) {
        console.error('Error loading teacher data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const activeStudents = students.filter((s) => s.status === 'active');

  return (
    <div className="space-y-6 pb-28 animate-fadeIn">
      {/* Teacher Welcome Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div
          className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: brand.primaryColor }}
        />

        <div className="relative z-10">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
            {t('profile.roleTeacher')}
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
            {teacher?.name || 'Professor'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('teacher.dashboardSubtitle')}
          </p>

          <button
            type="button"
            onClick={onOpenCreateRoutine}
            className="mt-4 w-full py-3 px-4 rounded-2xl bg-brand-primary hover:brightness-110 active:scale-[0.98] font-bold text-white text-xs shadow-lg flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t('teacher.createRoutine')}</span>
          </button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div
          onClick={() => onNavigateTab('students')}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md cursor-pointer hover:border-slate-700 transition"
        >
          <div className="flex items-center justify-between">
            <Users className="w-4 h-4 text-brand-primary" />
            <span className="text-[10px] text-emerald-400 font-bold">
              {activeStudents.length} {t('common.active')}
            </span>
          </div>
          <div className="text-xl font-black text-white mt-2">{students.length}</div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mt-0.5">
            {t('nav.students')}
          </span>
        </div>

        <div
          onClick={() => onNavigateTab('routines')}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md cursor-pointer hover:border-slate-700 transition"
        >
          <div className="flex items-center justify-between">
            <ClipboardList className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-white mt-2">{routines.length}</div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mt-0.5">
            {t('nav.routines')}
          </span>
        </div>

        <div
          onClick={() => onNavigateTab('exercises')}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md cursor-pointer hover:border-slate-700 transition"
        >
          <div className="flex items-center justify-between">
            <Library className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-white mt-2">{exercisesCount}</div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mt-0.5">
            {t('nav.exercises')}
          </span>
        </div>
      </div>

      {/* Retenção: quem sumiu */}
      <AtRiskCard />

      {/* Aulas de hoje */}
      <TodayClassesCard onOpen={() => onNavigateTab('classes')} />

      <EngagementCard onOpen={() => onNavigateTab('engage')} />

      <MonthReportCard />

      {/* Recent Students Activity */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-primary" />
            <span>{t('teacher.recentStudentsWorkouts')}</span>
          </h3>

          <button
            type="button"
            onClick={() => onNavigateTab('students')}
            className="text-xs font-semibold text-brand-primary hover:underline"
          >
            {t('teacher.viewAll')}
          </button>
        </div>

        <div className="divide-y divide-slate-800/80">
          {students.slice(0, 5).map((student) => (
            <div
              key={student.id}
              onClick={() => onNavigateTab('students')}
              className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 px-2 rounded-xl transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-xs text-white">
                  {student.name[0]}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{student.name}</h4>
                  <span className="text-xs text-slate-400">
                    {student.lastWorkoutDate
                      ? t('teacher.lastWorkout', {
                          date: formatDate(student.lastWorkoutDate, {
                            day: '2-digit',
                            month: 'short',
                          }),
                        })
                      : t('teacher.neverTrained')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 font-medium">
                  {student.plan}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
