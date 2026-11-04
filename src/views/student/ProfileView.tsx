import React, { useState } from 'react';
import {
  User,
  Globe,
  LogOut,
  MapPin,
  MessageSquare,
  Shield,
  Scale,
  Edit2,
  Check,
  Moon,
  Sun,
  Dumbbell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useBrand } from '../../context/BrandContext';
import { api } from '../../services/api';
import { Student, SupportedLanguage } from '../../types';

export const ProfileView: React.FC = () => {
  const { currentUser, role, logout, refreshUser } = useAuth();
  const { language, setLanguage, t, formatWeight } = useLanguage();
  const { brand } = useBrand();

  const student = currentUser as Student;

  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [newWeight, setNewWeight] = useState(String(student?.currentWeightKg || 80));
  const [isDarkMode, setIsDarkMode] = useState(true);

  const handleSaveWeight = async () => {
    if (!student) return;
    const val = parseFloat(newWeight);
    if (!isNaN(val) && val > 0) {
      await api.logWeight(student.id, val);
      await refreshUser();
      setIsEditingWeight(false);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  };

  return (
    <div className="space-y-6 pb-28 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">
          {t('profile.title')}
        </h2>
      </div>

      {/* User Info Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-primary flex items-center justify-center font-black text-xl text-white shadow-lg shrink-0">
          {currentUser?.name
            ? currentUser.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
            : 'AT'}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-black text-white truncate">
            {currentUser?.name}
          </h3>
          <p className="text-xs text-slate-400 truncate">{currentUser?.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-bold text-slate-300">
              {role === 'teacher' ? t('profile.roleTeacher') : t('profile.roleStudent')}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {brand.name}
            </span>
          </div>
        </div>
      </div>

      {/* Body Stats & Plan (Student only) */}
      {role === 'student' && student && (
        <div className="grid grid-cols-2 gap-3">
          {/* Weight Card with quick update */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-brand-primary" />
                <span>{t('profile.weight')}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsEditingWeight(!isEditingWeight)}
                className="text-slate-400 hover:text-white p-1"
                aria-label="Editar peso corporal"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {isEditingWeight ? (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  inputMode="decimal"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-20 bg-slate-950 border border-slate-700 rounded-xl px-2 py-1 text-sm font-bold text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveWeight}
                  className="p-1.5 rounded-xl bg-brand-primary text-white"
                  aria-label="Salvar novo peso"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="text-xl font-black text-white mt-2">
                {formatWeight(student.currentWeightKg)}
              </div>
            )}
            <span className="text-[10px] text-slate-500 mt-1 block">
              Meta: {formatWeight(student.targetWeightKg)}
            </span>
          </div>

          {/* Plan Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('profile.plan')}
            </span>
            <div className="text-xl font-black text-white mt-2">
              {student.plan}
            </div>
            <span className="text-[10px] text-emerald-400 mt-1 block font-semibold">
              Status: Ativo
            </span>
          </div>
        </div>
      )}

      {/* Language Selector (Portuguese / Spanish) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Globe className="w-4 h-4 text-brand-primary" />
          <span>{t('profile.language')}</span>
        </div>
        <p className="text-xs text-slate-400">
          {t('profile.languageDesc')}
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setLanguage('pt-BR')}
            className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-between ${
              language === 'pt-BR'
                ? 'bg-brand-primary text-white border-brand-primary shadow-md'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span>🇧🇷 {t('profile.portuguese')}</span>
            {language === 'pt-BR' && <Check className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setLanguage('es-PY')}
            className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-between ${
              language === 'es-PY'
                ? 'bg-brand-primary text-white border-brand-primary shadow-md'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span>🇵🇾 {t('profile.spanish')}</span>
            {language === 'es-PY' && <Check className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Gym Information & WhatsApp Contact */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand-primary" />
          <span>{t('profile.gymAddress')}</span>
        </h3>
        <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
          {brand.address}
        </p>

        <a
          href={`https://wa.me/${brand.whatsapp.replace(/[^0-9]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{t('profile.contactGym')}</span>
        </a>
      </div>

      {/* Logout Button */}
      <button
        type="button"
        onClick={logout}
        className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-red-500/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 text-xs font-bold flex items-center justify-center gap-2 transition"
      >
        <LogOut className="w-4 h-4" />
        <span>{t('auth.logout')}</span>
      </button>
    </div>
  );
};
