import React from 'react';
import { Sliders, User, Dumbbell, ShieldCheck } from 'lucide-react';
import { useBrand } from '../../context/BrandContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  onOpenDemo: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDemo }) => {
  const { brand, brandLogoUrl } = useBrand();
  const { currentUser, role } = useAuth();
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 safe-top">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Brand identity: logo & gym name */}
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={brandLogoUrl}
            alt={brand.name}
            className="w-9 h-9 rounded-xl shadow-md border border-white/10 shrink-0 object-cover"
          />
          <div className="min-w-0">
            <h1 className="text-sm font-extrabold text-white truncate tracking-tight leading-tight">
              {brand.name}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 truncate">
                {role === 'teacher' ? t('profile.roleTeacher') : currentUser?.name || t('profile.roleStudent')}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                {brand.gymCode}
              </span>
            </div>
          </div>
        </div>

        {/* Action icons: PWA install + Demo preset tuner */}
        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton />

          <button
            type="button"
            onClick={onOpenDemo}
            aria-label="Personalizar Marca (Demo White-Label)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 shadow-sm active:scale-95 transition"
          >
            <Sliders className="w-3.5 h-3.5 text-brand-primary" />
            <span className="hidden xs:inline">Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
