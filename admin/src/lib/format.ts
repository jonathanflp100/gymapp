import type { Currency } from './types';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const brl2 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const int = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const dec1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export const fmtBrl = (v: number, cents = false) => (cents ? brl2 : brl).format(Number.isFinite(v) ? v : 0);
export const fmtPyg = (v: number) => 'Gs. ' + int.format(Math.round(v));
export const fmtMoney = (v: number, c: Currency) => (c === 'BRL' ? fmtBrl(v) : fmtPyg(v));
export const fmtInt = (v: number) => int.format(Math.round(v));
export const fmtPct = (v: number) => (Number.isFinite(v) ? dec1.format(v * 100) + '%' : '—');

/** R$ 1,2 mi · R$ 350 mil · R$ 980 */
export function fmtBrlShort(v: number): string {
  const a = Math.abs(v);
  const s = v < 0 ? '-' : '';
  if (a >= 1e9) return `${s}R$ ${dec1.format(a / 1e9)} bi`;
  if (a >= 1e6) return `${s}R$ ${dec1.format(a / 1e6)} mi`;
  if (a >= 1e4) return `${s}R$ ${int.format(a / 1e3)} mil`;
  return s + brl.format(a);
}

/** Converte para reais com a cotação configurada (guaranis por real). */
export const toBrl = (v: number, c: Currency, fx: number) => (c === 'BRL' ? v : v / (fx || 1));

export const today = () => new Date().toISOString().slice(0, 10);
export const monthKey = (d: string | Date) => (typeof d === 'string' ? d.slice(0, 7) : d.toISOString().slice(0, 7));

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS[m - 1]}/${String(y).slice(2)}`;
};
export const fmtDate = (d?: string) => (d ? d.slice(0, 10).split('-').reverse().join('/') : '—');

/** Últimos n meses (chaves AAAA-MM), do mais antigo ao atual. */
export function lastMonths(n: number, ref = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() - i, 1));
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
}

export const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2));

export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

export const waLink = (phone: string, text = '') =>
  `https://wa.me/${phone.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
