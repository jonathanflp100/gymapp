import { BrandConfig } from '../types';

export const BRAND_PRESETS: Record<'forcaTotal' | 'titan', BrandConfig> = {
  forcaTotal: {
    id: 'forca-total',
    name: 'Academia Força Total',
    tagline: 'Superando seus limites todos os dias',
    logoUrl: '', // Uses dynamic brand SVG icon
    primaryColor: '#DC2626', // Vibrant Red
    secondaryColor: '#0F172A', // Deep Slate
    accentColor: '#EF4444',
    defaultLanguage: 'pt-BR',
    whatsapp: '+55 (11) 98765-4321',
    address: 'Av. Paulista, 1500 - Bela Vista, São Paulo - SP',
    gymCode: 'FORCA10',
    country: 'BR',
  },
  titan: {
    id: 'gimnasio-titan',
    name: 'Gimnasio Titán',
    tagline: 'Fuerza, disciplina y resultados reales',
    logoUrl: '', // Uses dynamic brand SVG icon
    primaryColor: '#2563EB', // Electric Blue
    secondaryColor: '#0F172A', // Deep Slate / Navy
    accentColor: '#3B82F6',
    defaultLanguage: 'es-PY',
    whatsapp: '+595 981 765432',
    address: 'Av. Mariscal López 3450, Asunción, Paraguay',
    gymCode: 'TITAN01',
    country: 'PY',
  },
};

// Marca padrão da instalação: VITE_BRAND=titan (Paraguai) ou forcaTotal (Brasil, padrão).
const envBrand = import.meta.env.VITE_BRAND as keyof typeof BRAND_PRESETS | undefined;
export const DEFAULT_BRAND: BrandConfig = (envBrand && BRAND_PRESETS[envBrand]) || BRAND_PRESETS.forcaTotal;

/**
 * Converts hex color code to RGB triplet for rgba() CSS utilities
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((char) => char + char)
      .join('');
  }
  const intVal = parseInt(cleanHex, 16);
  return {
    r: (intVal >> 16) & 255,
    g: (intVal >> 8) & 255,
    b: intVal & 255,
  };
}

/**
 * Injects dynamic CSS variables into document root to theme the entire application
 */
export function applyBrandTheme(brand: BrandConfig): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const primaryRgb = hexToRgb(brand.primaryColor);
  const secondaryRgb = hexToRgb(brand.secondaryColor);

  root.style.setProperty('--brand-primary', brand.primaryColor);
  root.style.setProperty('--brand-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
  root.style.setProperty('--brand-secondary', brand.secondaryColor);
  root.style.setProperty('--brand-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
  root.style.setProperty('--brand-accent', brand.accentColor || brand.primaryColor);

  // Update browser theme-color meta tag
  const metaTheme = document.getElementById('meta-theme-color');
  if (metaTheme) {
    metaTheme.setAttribute('content', brand.primaryColor);
  }

  // Update dynamic document title
  document.title = brand.name;
}

/**
 * Generates an SVG Data URI matching the brand's primary color and initials
 */
export function generateBrandLogoSvg(brand: BrandConfig): string {
  const initials = brand.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${brand.primaryColor}" />
        <stop offset="100%" stop-color="${brand.accentColor || brand.primaryColor}" />
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="28" fill="url(#brandGrad)"/>
    <path d="M28 42 H38 V78 H28 Z" fill="#FFFFFF" opacity="0.9"/>
    <path d="M38 50 H46 V70 H38 Z" fill="#FFFFFF" opacity="0.9"/>
    <rect x="46" y="56" width="28" height="8" rx="2" fill="#FFFFFF"/>
    <path d="M74 50 H82 V70 H74 Z" fill="#FFFFFF" opacity="0.9"/>
    <path d="M82 42 H92 V78 H82 Z" fill="#FFFFFF" opacity="0.9"/>
    <text x="60" y="104" font-family="system-ui, sans-serif" font-weight="900" font-size="14" fill="#FFFFFF" text-anchor="middle" letter-spacing="1.5">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
