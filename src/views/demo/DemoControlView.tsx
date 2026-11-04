import React, { useState } from 'react';
import {
  Sliders,
  Check,
  RotateCcw,
  Palette,
  Sparkles,
  User,
  X,
  Building,
  Phone,
  MapPin,
  Key,
} from 'lucide-react';
import { useBrand } from '../../context/BrandContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { BRAND_PRESETS } from '../../config/brand';

interface DemoControlViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoControlView: React.FC<DemoControlViewProps> = ({ isOpen, onClose }) => {
  const { brand, activePresetKey, setPreset, updateBrand, resetBrand } = useBrand();
  const { role, quickLoginAsStudent, quickLoginAsTeacher } = useAuth();
  const { t } = useLanguage();

  const [customName, setCustomName] = useState(brand.name);
  const [customTagline, setCustomTagline] = useState(brand.tagline);
  const [customPrimary, setCustomPrimary] = useState(brand.primaryColor);
  const [customSecondary, setCustomSecondary] = useState(brand.secondaryColor);
  const [customWhatsapp, setCustomWhatsapp] = useState(brand.whatsapp);
  const [customAddress, setCustomAddress] = useState(brand.address);
  const [customCode, setCustomCode] = useState(brand.gymCode);

  if (!isOpen) return null;

  const handleSelectPreset = (key: 'forcaTotal' | 'titan') => {
    setPreset(key);
    const selected = BRAND_PRESETS[key];
    setCustomName(selected.name);
    setCustomTagline(selected.tagline);
    setCustomPrimary(selected.primaryColor);
    setCustomSecondary(selected.secondaryColor);
    setCustomWhatsapp(selected.whatsapp);
    setCustomAddress(selected.address);
    setCustomCode(selected.gymCode);

    // Switch demo user to match gym country
    if (key === 'forcaTotal') {
      quickLoginAsStudent('student-1'); // Carlos Oliveira
    } else {
      quickLoginAsStudent('student-7'); // Mateo Alarcón
    }
  };

  const handleApplyColorChange = (newColor: string) => {
    setCustomPrimary(newColor);
    updateBrand({ primaryColor: newColor, accentColor: newColor });
  };

  const handleApplyCustomizations = () => {
    updateBrand({
      name: customName,
      tagline: customTagline,
      primaryColor: customPrimary,
      secondaryColor: customSecondary,
      whatsapp: customWhatsapp,
      address: customAddress,
      gymCode: customCode,
    });
    onClose();
  };

  // Color Swatches for quick live demo
  const sampleColorPalettes = [
    { name: 'Vermelho Fúria', hex: '#DC2626' },
    { name: 'Azul Titânio', hex: '#2563EB' },
    { name: 'Verde Neon / Bio', hex: '#059669' },
    { name: 'Laranja Hardcore', hex: '#EA580C' },
    { name: 'Dourado Gold', hex: '#D97706' },
    { name: 'Roxo Dark', hex: '#7C3AED' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl my-6 relative text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-primary flex items-center justify-center text-white">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">{t('demo.title')}</h2>
              <span className="text-[10px] text-brand-primary uppercase font-bold tracking-wider">
                {t('demo.badge')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 mt-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* 1. Presets Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              {t('demo.presetsTitle')}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Preset 1: Academia Força Total */}
              <button
                type="button"
                onClick={() => handleSelectPreset('forcaTotal')}
                className={`p-3.5 rounded-2xl border text-left transition flex items-start justify-between ${
                  activePresetKey === 'forcaTotal'
                    ? 'bg-slate-950 border-red-500 ring-2 ring-red-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 font-black text-sm text-white">
                    <span>🇧🇷</span>
                    <span>Força Total</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Brasil · pt-BR
                  </span>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-4 h-4 rounded-full bg-[#DC2626] border border-white/20" />
                    <span className="w-4 h-4 rounded-full bg-[#0F172A] border border-white/20" />
                    <span className="text-[10px] text-slate-400 font-mono">FORCA10</span>
                  </div>
                </div>

                {activePresetKey === 'forcaTotal' && (
                  <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>

              {/* Preset 2: Gimnasio Titán */}
              <button
                type="button"
                onClick={() => handleSelectPreset('titan')}
                className={`p-3.5 rounded-2xl border text-left transition flex items-start justify-between ${
                  activePresetKey === 'titan'
                    ? 'bg-slate-950 border-blue-500 ring-2 ring-blue-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 font-black text-sm text-white">
                    <span>🇵🇾</span>
                    <span>Gimnasio Titán</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Paraguay · es-PY
                  </span>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-4 h-4 rounded-full bg-[#2563EB] border border-white/20" />
                    <span className="w-4 h-4 rounded-full bg-[#0F172A] border border-white/20" />
                    <span className="text-[10px] text-slate-400 font-mono">TITAN01</span>
                  </div>
                </div>

                {activePresetKey === 'titan' && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* 2. Live Color Customization */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-brand-primary" />
              <span>Cores da Marca em Tempo Real</span>
            </label>

            {/* Quick Swatches */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
              {sampleColorPalettes.map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() => handleApplyColorChange(swatch.hex)}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition ${
                    customPrimary.toLowerCase() === swatch.hex.toLowerCase()
                      ? 'border-white bg-slate-800 scale-105'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full shadow-inner"
                    style={{ backgroundColor: swatch.hex }}
                  />
                  <span className="text-[9px] font-semibold text-slate-300 truncate w-full text-center">
                    {swatch.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Hex Color Picker input */}
            <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
              <input
                type="color"
                value={customPrimary}
                onChange={(e) => handleApplyColorChange(e.target.value)}
                className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
              />
              <div className="flex-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Cor Primária Hexadecimal
                </span>
                <input
                  type="text"
                  value={customPrimary}
                  onChange={(e) => handleApplyColorChange(e.target.value)}
                  className="bg-transparent text-xs font-mono font-bold text-white uppercase focus:outline-none w-full"
                />
              </div>
            </div>
          </div>

          {/* 3. Live Brand Identity Tuning */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
              <Building className="w-4 h-4 text-brand-primary" />
              <span>{t('demo.customBrandTitle')}</span>
            </label>

            <div>
              <span className="text-[11px] text-slate-400 block mb-1">{t('demo.gymName')}</span>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block mb-1">{t('demo.tagline')}</span>
              <input
                type="text"
                value={customTagline}
                onChange={(e) => setCustomTagline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">{t('demo.gymCode')}</span>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono uppercase focus:outline-none"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-1">{t('demo.whatsapp')}</span>
                <input
                  type="text"
                  value={customWhatsapp}
                  onChange={(e) => setCustomWhatsapp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 4. Quick User Role Switcher for Fast Demos */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <User className="w-4 h-4 text-brand-primary" />
              <span>{t('demo.quickSwitchUser')}</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  quickLoginAsStudent();
                  onClose();
                }}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  role === 'student'
                    ? 'bg-brand-primary text-white border-brand-primary'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{t('demo.switchStudent')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  quickLoginAsTeacher();
                  onClose();
                }}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  role === 'teacher'
                    ? 'bg-brand-primary text-white border-brand-primary'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{t('demo.switchTeacher')}</span>
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={resetBrand}
              className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('demo.resetToDefault')}</span>
            </button>

            <button
              type="button"
              onClick={handleApplyCustomizations}
              className="flex-1 py-3 px-4 rounded-2xl bg-brand-primary hover:brightness-110 active:scale-95 text-xs font-bold text-white shadow-xl flex items-center justify-center gap-2 transition"
            >
              <Check className="w-4 h-4" />
              <span>{t('demo.applyAndClose')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
