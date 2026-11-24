/**
 * Página pública da academia e vitrine (loja).
 * Modo demonstração: guardado no aparelho (localStorage), com exemplos.
 * Modo completo: servidor da academia (/api/hub/public, /storefront, /store-images).
 */
import type { BrandConfig, PublicGym, Storefront } from '../types';
import { REAL_BACKEND } from './openGymBackend';
import { compressImage } from './photos';
import { demoWeeklyClasses } from './extrasApi';

const KEY = 'gymapp_storefront';

const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function demoStorefront(lang: 'pt-BR' | 'es-PY'): Storefront {
  const es = lang === 'es-PY';
  return {
    publicPageEnabled: true,
    shopEnabled: true,
    about: es
      ? 'Gimnasio completo con musculación, clases grupales y entrenadores para acompañarte. Rutinas en la app y check-in con QR.'
      : 'Academia completa com musculação, aulas coletivas e professores para acompanhar você. Treinos no app e check-in por QR.',
    hours: es ? 'Lunes a viernes 5:30–22:00 · Sábados 7:00–13:00' : 'Segunda a sexta 5h30–22h · Sábados 7h–13h',
    gallery: [],
    plans: es
      ? [
          { id: 'p1', name: 'Mensual', price: 'Gs. 180.000', period: 'por mes', description: 'Musculación y app con tu rutina', highlight: false },
          { id: 'p2', name: 'Mensual + Clases', price: 'Gs. 250.000', period: 'por mes', description: 'Todo lo del mensual + clases grupales', highlight: true },
          { id: 'p3', name: 'Anual', price: 'Gs. 1.800.000', period: 'por año', description: 'Ahorrá 2 meses pagando el año', highlight: false },
        ]
      : [
          { id: 'p1', name: 'Mensal', price: 'R$ 99,90', period: 'por mês', description: 'Musculação e app com seu treino', highlight: false },
          { id: 'p2', name: 'Mensal + Aulas', price: 'R$ 139,90', period: 'por mês', description: 'Tudo do mensal + aulas coletivas', highlight: true },
          { id: 'p3', name: 'Anual', price: 'R$ 999', period: 'por ano', description: 'Economize 2 meses pagando o ano', highlight: false },
        ],
    products: es
      ? [
          { id: 'x1', name: 'Proteína whey 900 g', price: 'Gs. 280.000', category: 'Suplementos', description: 'Sabor chocolate o vainilla', imageUrl: '', available: true },
          { id: 'x2', name: 'Creatina 300 g', price: 'Gs. 190.000', category: 'Suplementos', description: '', imageUrl: '', available: true },
          { id: 'x3', name: 'Remera del gimnasio', price: 'Gs. 90.000', category: 'Ropa', description: 'Talles S al XL', imageUrl: '', available: true },
          { id: 'x4', name: 'Botella 1 L', price: 'Gs. 45.000', category: 'Accesorios', description: '', imageUrl: '', available: true },
        ]
      : [
          { id: 'x1', name: 'Whey protein 900 g', price: 'R$ 149,90', category: 'Suplementos', description: 'Sabor chocolate ou baunilha', imageUrl: '', available: true },
          { id: 'x2', name: 'Creatina 300 g', price: 'R$ 99,90', category: 'Suplementos', description: '', imageUrl: '', available: true },
          { id: 'x3', name: 'Camiseta da academia', price: 'R$ 59,90', category: 'Roupas', description: 'Tamanhos P ao GG', imageUrl: '', available: true },
          { id: 'x4', name: 'Garrafa 1 L', price: 'R$ 29,90', category: 'Acessórios', description: '', imageUrl: '', available: true },
        ],
  };
}

function loadDemo(lang: 'pt-BR' | 'es-PY'): Storefront {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return demoStorefront(lang);
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/hub${path}`, {
    method,
    credentials: 'include',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `Erro ${res.status}`);
  return data as T;
}

export const storefrontApi = {
  /** Para o dono editar (inclui produtos indisponíveis). */
  async get(lang: 'pt-BR' | 'es-PY'): Promise<Storefront> {
    if (REAL_BACKEND) return call<Storefront>('GET', '/storefront');
    return loadDemo(lang);
  },
  async save(sf: Storefront): Promise<Storefront> {
    if (REAL_BACKEND) return call<Storefront>('PUT', '/storefront', sf);
    try {
      localStorage.setItem(KEY, JSON.stringify(sf));
    } catch {
      throw new Error('Sem espaço no aparelho para salvar (fotos demais?)');
    }
    return sf;
  },
  /** Comprime e envia uma foto. Devolve o endereço para guardar na página/loja. */
  async uploadImage(file: File, kind: 'gallery' | 'product'): Promise<string> {
    const data = await compressImage(file, kind === 'gallery' ? 1200 : 700, 0.78);
    if (!REAL_BACKEND) return data;
    const r = await call<{ url: string }>('POST', '/store-images', { data });
    return r.url;
  },
  /** O que a página pública e a loja do aluno mostram. */
  async publicData(brand: BrandConfig, lang: 'pt-BR' | 'es-PY'): Promise<PublicGym> {
    if (REAL_BACKEND) return call<PublicGym>('GET', '/public');
    const sf = loadDemo(lang);
    return {
      brand: { name: brand.name, tagline: brand.tagline, logoUrl: brand.logoUrl, primaryColor: brand.primaryColor, secondaryColor: brand.secondaryColor, defaultLanguage: brand.defaultLanguage, whatsapp: brand.whatsapp, address: brand.address },
      publicPageEnabled: sf.publicPageEnabled,
      shopEnabled: sf.shopEnabled,
      about: sf.about,
      hours: sf.hours,
      gallery: sf.gallery,
      plans: sf.plans,
      products: sf.products.filter((p) => p.available),
      classes: demoWeeklyClasses().map(({ id, name, weekday, time, durationMin, room, color, intensity }) => ({ id, name, weekday, time, durationMin, room, color, intensity })),
    };
  },
  newId: uid,
};

/** Link do WhatsApp com mensagem pronta. */
export const waLink = (phone: string | undefined, text: string) => {
  const digits = (phone || '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : '';
};

/** Endereço público da página da academia (mesmo domínio do app). */
export const publicPageUrl = () => `${window.location.origin}/academia`;
