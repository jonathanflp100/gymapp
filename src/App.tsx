import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { BrandProvider, useBrand } from './context/BrandContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { BottomNav, ActiveTab } from './components/common/BottomNav';
import { HomeView } from './views/student/HomeView';
import { WorkoutView } from './views/student/WorkoutView';
import { EvolutionView } from './views/student/EvolutionView';
import { ClassesView } from './views/shared/ClassesView';
import { ProfileView } from './views/student/ProfileView';
import { TeacherDashboard } from './views/teacher/TeacherDashboard';
import { StudentsView } from './views/teacher/StudentsView';
import { RoutinesView } from './views/teacher/RoutinesView';
import { ExerciseLibraryView } from './views/teacher/ExerciseLibraryView';
import { DemoControlView } from './views/demo/DemoControlView';
import { LoginView } from './views/auth/LoginView';
import { RealAuthView } from './views/auth/RealAuthView';
import { DEFAULT_BRAND } from './config/brand';
import { REAL_BACKEND } from './services/openGymBackend';
import { Routine } from './types';

function MainApp() {
  const { isAuthenticated, role } = useAuth();
  const { brand } = useBrand();
  const { language } = useLanguage();

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [activeWorkoutRoutine, setActiveWorkoutRoutine] = useState<Routine | null>(null);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [openCreateRoutineDirectly, setOpenCreateRoutineDirectly] = useState(false);

  // Check URL pathname for /demo on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const search = window.location.search;
      if (path === '/demo' || search.includes('demo=true') || search.includes('demo=1')) {
        setIsDemoOpen(true);
      }
    }
  }, []);

  // When switching roles, reset active tab
  useEffect(() => {
    if (role === 'teacher') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('home');
    }
  }, [role]);

  if (!isAuthenticated) {
    return (
      <>
        {REAL_BACKEND ? <RealAuthView /> : <LoginView />}
        <DemoControlView isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
      </>
    );
  }

  const handleStartWorkout = (routine?: Routine) => {
    if (routine) {
      setActiveWorkoutRoutine(routine);
    }
    setActiveTab('workout');
  };

  const handleFinishWorkoutSuccess = () => {
    setActiveWorkoutRoutine(null);
    setActiveTab('home');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-primary selection:text-white">
      {/* Top Header */}
      <Header onOpenDemo={() => setIsDemoOpen(true)} onOpenProfile={() => setActiveTab('profile')} />

      {/* Main View Area (Mobile-First constrained container) */}
      <main key={language} className="flex-1 max-w-md w-full mx-auto px-4 pt-4">
        {/* STUDENT VIEWS */}
        {role === 'student' && (
          <>
            {activeTab === 'home' && (
              <HomeView
                onStartWorkout={handleStartWorkout}
                onNavigateToTab={(tab) => setActiveTab(tab as ActiveTab)}
              />
            )}
            {activeTab === 'workout' && (
              <WorkoutView
                initialRoutine={activeWorkoutRoutine}
                onFinishWorkoutSuccess={handleFinishWorkoutSuccess}
              />
            )}
            {activeTab === 'classes' && <ClassesView mode="student" />}
            {activeTab === 'evolution' && <EvolutionView />}
            {activeTab === 'history' && <EvolutionView initialTab="history" />}
            {activeTab === 'profile' && <ProfileView />}
          </>
        )}

        {/* TEACHER VIEWS */}
        {role === 'teacher' && (
          <>
            {activeTab === 'dashboard' && (
              <TeacherDashboard
                onNavigateTab={(tab) => setActiveTab(tab as ActiveTab)}
                onOpenCreateRoutine={() => {
                  setOpenCreateRoutineDirectly(true);
                  setActiveTab('routines');
                }}
              />
            )}
            {activeTab === 'students' && <StudentsView />}
            {activeTab === 'routines' && (
              <RoutinesView initialCreateOpen={openCreateRoutineDirectly} />
            )}
            {activeTab === 'classes' && <ClassesView mode="teacher" />}
            {activeTab === 'exercises' && <ExerciseLibraryView />}
            {activeTab === 'profile' && <ProfileView />}
          </>
        )}
      </main>

      {/* Persistent Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setOpenCreateRoutineDirectly(false);
          setActiveTab(tab);
        }}
      />

      {/* Hidden /demo Live Tuner & Presets Drawer */}
      <DemoControlView isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider defaultLang={DEFAULT_BRAND.defaultLanguage}>
      <BrandProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </BrandProvider>
    </LanguageProvider>
  );
}
