import React from 'react';
import {
  Home,
  Dumbbell,
  TrendingUp,
  History,
  User,
  Users,
  ClipboardList,
  Library,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useBrand } from '../../context/BrandContext';

export type StudentTab = 'home' | 'workout' | 'evolution' | 'history' | 'profile';
export type TeacherTab = 'dashboard' | 'students' | 'routines' | 'exercises' | 'profile';
export type ActiveTab = StudentTab | TeacherTab;

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const { role } = useAuth();
  const { t } = useLanguage();
  const { brand } = useBrand();

  const isTeacher = role === 'teacher';

  const studentItems: { id: StudentTab; label: string; icon: React.FC<{ className?: string; style?: React.CSSProperties }> }[] = [
    { id: 'home', label: t('nav.home'), icon: Home },
    { id: 'workout', label: t('nav.workout'), icon: Dumbbell },
    { id: 'evolution', label: t('nav.evolution'), icon: TrendingUp },
    { id: 'history', label: t('nav.history'), icon: History },
    { id: 'profile', label: t('nav.profile'), icon: User },
  ];

  const teacherItems: { id: TeacherTab; label: string; icon: React.FC<{ className?: string; style?: React.CSSProperties }> }[] = [
    { id: 'dashboard', label: t('nav.home'), icon: Home },
    { id: 'students', label: t('nav.students'), icon: Users },
    { id: 'routines', label: t('nav.routines'), icon: ClipboardList },
    { id: 'exercises', label: t('nav.exercises'), icon: Library },
    { id: 'profile', label: t('nav.profile'), icon: User },
  ];

  const items = isTeacher ? teacherItems : studentItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 safe-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1.5">
        {items.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all relative ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Highlight background pill */}
              {isActive && (
                <div
                  className="absolute inset-x-2 inset-y-0.5 rounded-xl opacity-15 pointer-events-none"
                  style={{ backgroundColor: brand.primaryColor }}
                />
              )}

              <div className="relative">
                <IconComponent
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`}
                  style={{ color: isActive ? brand.primaryColor : undefined }}
                />
                {/* Active indicator dot */}
                {isActive && (
                  <span
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: brand.primaryColor }}
                  />
                )}
              </div>

              <span
                className={`text-[10px] mt-1 font-semibold truncate ${
                  isActive ? 'font-bold' : ''
                }`}
                style={{ color: isActive ? brand.primaryColor : undefined }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
