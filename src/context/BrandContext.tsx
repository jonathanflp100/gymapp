import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrandConfig } from '../types';
import { BRAND_PRESETS, DEFAULT_BRAND, applyBrandTheme, generateBrandLogoSvg } from '../config/brand';
import { useLanguage } from '../i18n/LanguageContext';

interface BrandContextType {
  brand: BrandConfig;
  activePresetKey: 'forcaTotal' | 'titan' | 'custom';
  setPreset: (presetKey: 'forcaTotal' | 'titan') => void;
  updateBrand: (updates: Partial<BrandConfig>) => void;
  resetBrand: () => void;
  brandLogoUrl: string;
}

const BrandContext = createContext<BrandContextType | null>(null);

const BRAND_STORAGE_KEY = 'gymapp_active_brand_config';
const PRESET_KEY = 'gymapp_active_preset_name';

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setLanguage } = useLanguage();

  const [activePresetKey, setActivePresetKey] = useState<'forcaTotal' | 'titan' | 'custom'>(() => {
    if (typeof window !== 'undefined') {
      const savedPreset = localStorage.getItem(PRESET_KEY) as 'forcaTotal' | 'titan' | 'custom' | null;
      if (savedPreset) return savedPreset;
    }
    return 'forcaTotal';
  });

  const [brand, setBrandState] = useState<BrandConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(BRAND_STORAGE_KEY);
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
        const manifestUrl = URL.createObjectURL(blob);

        let manifestLink = document.getElementById('dynamic-manifest') as HTMLLinkElement | null;
        if (manifestLink) {
          manifestLink.setAttribute('href', manifestUrl);
        }

        let faviconLink = document.getElementById('dynamic-favicon') as HTMLLinkElement | null;
        if (faviconLink) {
          faviconLink.setAttribute('href', generateBrandLogoSvg(brand));
        }

        let appleLink = document.getElementById('dynamic-apple-icon') as HTMLLinkElement | null;
        if (appleLink) {
          appleLink.setAttribute('href', generateBrandLogoSvg(brand));
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
