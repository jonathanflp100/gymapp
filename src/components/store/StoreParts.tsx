import React from 'react';
import { Check, MessageCircle, Package, Star } from 'lucide-react';
import type { StorePlan, StoreProduct } from '../../types';

export type Lang = 'pt-BR' | 'es-PY';

export const STORE_TXT = {
  'pt-BR': {
    order: 'Pedir pelo WhatsApp',
    wantPlan: 'Quero este plano',
    orderMsg: (p: string, price: string, who?: string) => `Olá! ${who ? `Sou ${who}, aluno da academia. ` : ''}Quero o produto: ${p}${price ? ` (${price})` : ''}. Ainda tem?`,
    planMsg: (p: string) => `Olá! Vi a página da academia e quero saber mais sobre o plano ${p}.`,
    popular: 'Mais escolhido',
    noWhats: 'A academia ainda não cadastrou o WhatsApp.',
  },
  'es-PY': {
    order: 'Pedir por WhatsApp',
    wantPlan: 'Quiero este plan',
    orderMsg: (p: string, price: string, who?: string) => `¡Hola! ${who ? `Soy ${who}, alumno del gimnasio. ` : ''}Quiero el producto: ${p}${price ? ` (${price})` : ''}. ¿Hay disponible?`,
    planMsg: (p: string) => `¡Hola! Vi la página del gimnasio y quiero saber más sobre el plan ${p}.`,
    popular: 'Más elegido',
    noWhats: 'El gimnasio todavía no cargó su WhatsApp.',
  },
};

const waUrl = (phone: string | undefined, text: string) => {
  const d = (phone || '').replace(/\D/g, '');
  return d ? `https://wa.me/${d}?text=${encodeURIComponent(text)}` : '';
};

export function ProductCard({ p, lang, whatsapp, color, studentName }: { p: StoreProduct; lang: Lang; whatsapp?: string; color: string; studentName?: string }) {
  const t = STORE_TXT[lang];
  const href = waUrl(whatsapp, t.orderMsg(p.name, p.price, studentName));
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col">
      <div className="aspect-square bg-slate-800 grid place-items-center overflow-hidden">
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <Package className="w-10 h-10 text-slate-600" aria-hidden />
        )}
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        {p.category && <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{p.category}</span>}
        <span className="text-sm font-bold text-white leading-snug">{p.name}</span>
        {p.description && <span className="text-xs text-slate-400 leading-snug">{p.description}</span>}
        <span className="mt-auto pt-2 text-base font-black text-white">{p.price}</span>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: color }}>
            <MessageCircle className="w-3.5 h-3.5" /> {t.order}
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function PlanCard({ p, lang, whatsapp, color }: { p: StorePlan; lang: Lang; whatsapp?: string; color: string }) {
  const t = STORE_TXT[lang];
  const href = waUrl(whatsapp, t.planMsg(p.name));
  return (
    <div className={`relative rounded-3xl border p-5 flex flex-col gap-2 ${p.highlight ? 'bg-slate-900' : 'bg-slate-900/60 border-slate-800'}`} style={p.highlight ? { borderColor: color } : undefined}>
      {p.highlight && (
        <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: color }}>
          <Star className="w-3 h-3 fill-current" /> {t.popular}
        </span>
      )}
      <span className="text-sm font-bold text-slate-300">{p.name}</span>
      <span className="text-3xl font-black text-white">
        {p.price} {p.period && <span className="text-sm font-semibold text-slate-400">{p.period}</span>}
      </span>
      {p.description && (
        <span className="text-sm text-slate-300 flex gap-2">
          <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color }} /> {p.description}
        </span>
      )}
      {href && (
        <a href={href} target="_blank" rel="noreferrer" className={`mt-2 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${p.highlight ? 'text-white' : 'text-white bg-slate-800 hover:bg-slate-700'}`} style={p.highlight ? { backgroundColor: color } : undefined}>
          {t.wantPlan}
        </a>
      )}
    </div>
  );
}
