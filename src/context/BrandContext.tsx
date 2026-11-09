import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrandConfig } from '../types';
import { BRAND_PRESETS, DEFAULT_BRAND, applyBrandTheme, generateBrandLogoSvg } from '../config/brand';
import { useLanguage } from '../i18n/LanguageContext';
import { REAL_BACKEND } from '../services/openGymBackend';
import { hub } from '../services/hub';

interface BrandContextType {
  brand: BrandConfig;
  activePresetKey: 'forcaTotal' | 'titan' | 'custom';
  setPreset: (presetKey: 'forcaTotal' | 'titan') => void;
  updateBrand: (updates: Partial<BrandConfig>) => void;
  resetBrand: () => void;
  brandLogoUrl: string;
  /** Salva a marca: no servidor (modo completo) ou no aparelho (demo). */
  saveBrand: (updates: Partial<BrandConfig>) => Promise<void>;
  /** Modo completo: true até a marca do servidor chegar. */
  brandLoading: boolean;
}

const BrandContext = createContext<BrandContextType | null>(null);

const BRAND_STORAGE_KEY = 'gymapp_active_brand_config';
const PRESET_KEY = 'gymapp_active_preset_name';

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setLanguage } = useLanguage();
  const [brandLoading, setBrandLoading] = useState(REAL_BACKEND);

  // Modo completo: a marca da academia vem do servidor
  useEffect(() => {
    if (!REAL_BACKEND) return;
    hub
      .settings()
      .then((remote) => {
        setBrandState({ ...DEFAULT_BRAND, ...remote });
        let chosen: string | null = null;
        try {
          chosen = localStorage.getItem('gymapp_preferred_language');
        } catch {
          /* ignora */
        }
        if (!chosen && remote.defaultLanguage) setLanguage(remote.defaultLanguage);
      })
      .catch((err) => console.warn('Não foi possível carregar a marca da academia:', err))
      .finally(() => setBrandLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activePresetKey, setActivePresetKey] = useState<'forcaTotal' | 'titan' | 'custom'>(() => {
    if (typeof window !== 'undefined') {
      const savedPreset = localStorage.getItem(PRESET_KEY) as 'forcaTotal' | 'titan' | 'custom' | null;
      if (savedPreset) return savedPreset;
    }
    return 'forcaTotal';
  });

  const [brand, setBrandState] = useState<BrandConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = REAL_BACKEND ? null : localStorage.getItem(BRAND_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore error
        }
      }
    }
    return DEFAULT_BRAND;
  });

  // Apply CSS theme variables whenever brand changes
  useEffect(() => {
    applyBrandTheme(brand);

    // Update dynamic manifest blob
    if (typeof window !== 'undefined') {
      try {
        const manifestData = {
          id: '/',
          name: brand.name,
          short_name: brand.name.slice(0, 12),
          description: brand.tagline,
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: brand.secondaryColor,
          theme_color: brand.primaryColor,
          icons: [
            {
              src: generateBrandLogoSvg(brand),
              sizes: '192x192 512x512',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        };

        const stringManifest = JSON.stringify(manifestData);
        const blob = new Blob([stringManifest], { type: 'application/json' });
        // Modo completo: manifest e ícone servidos pelo servidor da academia (instalação do PWA com a logo dela)
        const version = encodeURIComponent((brand as BrandConfig & { updatedAt?: string }).updatedAt || '1');
        const manifestUrl = REAL_BACKEND ? `/api/hub/manifest.webmanifest?v=${version}` : URL.createObjectURL(blob);
        const iconUrl = REAL_BACKEND ? `/api/hub/icon?v=${version}` : brand.logoUrl || generateBrandLogoSvg(brand);

        let manifestLink = document.getElementById('dynamic-manifest') as HTMLLinkElement | null;
        if (manifestLink) {
          manifestLink.setAttribute('href', manifestUrl);
        }

        let faviconLink = document.getElementById('dynamic-favicon') as HTMLLinkElement | null;
        if (faviconLink) {
          faviconLink.setAttribute('href', iconUrl);
        }

        let appleLink = document.getElementById('dynamic-apple-icon') as HTMLLinkElement | null;
        if (appleLink) {
          appleLink.setAttribute('href', iconUrl);
        }
      } catch (e) {
        console.warn('Could not inject dynamic manifest:', e);
      }
    }
  }, [brand]);

  const setPreset = (presetKey: 'forcaTotal' | 'titan') => {
    const selected = BRAND_PRESETS[presetKey];
    setBrandState(selected);
    setActivePresetKey(presetKey);
    setLanguage(selected.defaultLanguage);
    if (typeof window !== 'undefined') {
      localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(selected));
      localStorage.setItem(PRESET_KEY, presetKey);
    }
  };

  const updateBrand = (updates: Partial<BrandConfig>) => {
    const updated = { ...brand, ...updates };
    setBrandState(updated);
    setActivePresetKey('custom');
    if (typeof window !== 'undefined') {
      localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem(PRESET_KEY, 'custom');
    }
  };

  const saveBrand = async (updates: Partial<BrandConfig>) => {
    if (REAL_BACKEND) {
      const saved = await hub.saveSettings(updates);
      setBrandState({ ...DEFAULT_BRAND, ...saved });
      return;
    }
    updateBrand(updates);
  };

  const resetBrand = () => {
    setPreset('forcaTotal');
  };

  const brandLogoUrl = brand.logoUrl || generateBrandLogoSvg(brand);

  return (
    <BrandContext.Provider
      value={{
        brand,
        activePresetKey,
        setPreset,
        updateBrand,
        resetBrand,
        brandLogoUrl,
        saveBrand,
        brandLoading,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
};

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}
