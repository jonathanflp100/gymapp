import React, { useEffect, useRef, useState } from 'react';
import qrcode from 'qrcode-generator';
import { Copy, ExternalLink, Globe, ImagePlus, Package, Plus, Printer, Save, ShoppingBag, Star, Trash2, X } from 'lucide-react';
import { useBrand } from '../../context/BrandContext';
import { useLanguage } from '../../i18n/LanguageContext';
import type { Storefront, StorePlan, StoreProduct } from '../../types';
import { publicPageUrl, storefrontApi } from '../../services/storefrontApi';
import { printHtml } from '../../services/print';

const TX = {
  'pt-BR': {
    page: 'Página pública da academia',
    pageHint: 'Um link aberto (sem login) com fotos, horários, planos, aulas e o botão de aula experimental no WhatsApp. Coloque na bio do Instagram.',
    show: 'Página no ar',
    link: 'Link da página',
    copy: 'Copiar',
    copied: 'Copiado',
    open: 'Abrir',
    poster: 'Cartaz com QR',
    posterTitle: 'Conheça a academia',
    posterSub: 'Aponte a câmera do celular',
    about: 'Sobre a academia',
    hours: 'Horário de funcionamento',
    gallery: 'Fotos (até 8)',
    addPhoto: 'Adicionar foto',
    plans: 'Planos',
    addPlan: 'Adicionar plano',
    planName: 'Nome do plano',
    price: 'Preço',
    period: 'Período (ex.: por mês)',
    desc: 'Descrição',
    highlight: 'Destacar (mais escolhido)',
    shop: 'Loja da academia',
    shopHint: 'Suplementos, roupas e acessórios. Alunos e visitantes pedem pelo WhatsApp e retiram na academia.',
    shopOn: 'Loja ligada',
    addProduct: 'Adicionar produto',
    productName: 'Nome do produto',
    category: 'Categoria',
    available: 'Disponível',
    save: 'Salvar página e loja',
    saving: 'Salvando…',
    saved: 'Salvo!',
    noWhats: 'Cadastre o WhatsApp da academia (em Contato, acima) para os botões de pedido e de aula experimental aparecerem.',
    photo: 'Foto',
    remove: 'Remover',
  },
  'es-PY': {
    page: 'Página pública del gimnasio',
    pageHint: 'Un link abierto (sin login) con fotos, horarios, planes, clases y el botón de clase de prueba por WhatsApp. Ponelo en la bio de Instagram.',
    show: 'Página publicada',
    link: 'Link de la página',
    copy: 'Copiar',
    copied: 'Copiado',
    open: 'Abrir',
    poster: 'Cartel con QR',
    posterTitle: 'Conocé el gimnasio',
    posterSub: 'Apuntá la cámara del celular',
    about: 'Sobre el gimnasio',
    hours: 'Horario de atención',
    gallery: 'Fotos (hasta 8)',
    addPhoto: 'Agregar foto',
    plans: 'Planes',
    addPlan: 'Agregar plan',
    planName: 'Nombre del plan',
    price: 'Precio',
    period: 'Período (ej.: por mes)',
    desc: 'Descripción',
    highlight: 'Destacar (más elegido)',
    shop: 'Tienda del gimnasio',
    shopHint: 'Suplementos, ropa y accesorios. Alumnos y visitantes piden por WhatsApp y retiran en el gimnasio.',
    shopOn: 'Tienda activa',
    addProduct: 'Agregar producto',
    productName: 'Nombre del producto',
    category: 'Categoría',
    available: 'Disponible',
    save: 'Guardar página y tienda',
    saving: 'Guardando…',
    saved: '¡Guardado!',
    noWhats: 'Cargá el WhatsApp del gimnasio (en Contacto, arriba) para que aparezcan los botones de pedido y de clase de prueba.',
    photo: 'Foto',
    remove: 'Quitar',
  },
};

const field = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary';
const label = 'text-[11px] font-bold text-slate-400 block mb-1';

export const StorefrontEditor: React.FC = () => {
  const { brand } = useBrand();
  const { language } = useLanguage();
  const t = TX[language];
  const [sf, setSf] = useState<Storefront | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | string>('idle');
  const [copied, setCopied] = useState(false);
  const [busyImg, setBusyImg] = useState(false);
  const galleryInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    storefrontApi.get(language).then(setSf).catch((e) => setStatus(String(e.message || e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!sf) return null;
  const url = publicPageUrl();
  const upd = (patch: Partial<Storefront>) => {
    setSf({ ...sf, ...patch });
    setStatus('idle');
  };
  const updPlan = (i: number, patch: Partial<StorePlan>) => upd({ plans: sf.plans.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  const updProd = (i: number, patch: Partial<StoreProduct>) => upd({ products: sf.products.map((p, j) => (j === i ? { ...p, ...patch } : p)) });

  const upload = async (file: File | undefined, kind: 'gallery' | 'product', i?: number) => {
    if (!file) return;
    setBusyImg(true);
    try {
      const src = await storefrontApi.uploadImage(file, kind);
      if (kind === 'gallery') upd({ gallery: [...sf.gallery, src].slice(0, 8) });
      else if (i !== undefined) updProd(i, { imageUrl: src });
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusyImg(false);
    }
  };

  const save = async () => {
    setStatus('saving');
    try {
      setSf(await storefrontApi.save(sf));
      setStatus('saved');
    } catch (e) {
      setStatus((e as Error).message);
    }
  };

  const poster = () => {
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    printHtml(
      `<div style="text-align:center;padding:40px 20px;font-family:Arial,sans-serif">
        <h1 style="font-size:40px;margin:0 0 6px">${brand.name.replace(/</g, '&lt;')}</h1>
        <p style="font-size:22px;margin:0 0 28px;color:#444">${t.posterTitle}</p>
        <div style="width:340px;margin:0 auto">${qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true })}</div>
        <p style="font-size:18px;margin-top:22px;color:#444">${t.posterSub}</p>
        <p style="font-size:14px;color:#777">${url}</p>
      </div>`,
      t.poster,
      brand,
    );
  };

  return (
    <>
      {/* página pública */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3.5">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span className="text-brand-primary"><Globe className="w-4 h-4" /></span> {t.page}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">{t.pageHint}</p>
        </div>
        {!brand.whatsapp && <p className="text-xs text-amber-300">{t.noWhats}</p>}
        <Toggle label={t.show} checked={sf.publicPageEnabled} onChange={(v) => upd({ publicPageEnabled: v })} />
        <div>
          <span className={label}>{t.link}</span>
          <div className="flex flex-wrap gap-2 items-center">
            <code className="flex-1 min-w-0 truncate rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-sky-300">{url}</code>
            <button type="button" className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-white" onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
              <Copy className="w-3.5 h-3.5" /> {copied ? t.copied : t.copy}
            </button>
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-white"><ExternalLink className="w-3.5 h-3.5" /> {t.open}</a>
            <button type="button" className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-white" onClick={poster}><Printer className="w-3.5 h-3.5" /> {t.poster}</button>
          </div>
        </div>
        <label className="block">
          <span className={label}>{t.about}</span>
          <textarea className={`${field} min-h-[90px]`} maxLength={1200} value={sf.about} onChange={(e) => upd({ about: e.target.value })} />
        </label>
        <label className="block">
          <span className={label}>{t.hours}</span>
          <textarea className={`${field} min-h-[60px]`} maxLength={400} value={sf.hours} onChange={(e) => upd({ hours: e.target.value })} />
        </label>
        <div>
          <span className={label}>{t.gallery}</span>
          <div className="flex flex-wrap gap-2">
            {sf.gallery.map((src, i) => (
              <div key={src + i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-800">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button type="button" aria-label={t.remove} onClick={() => upd({ gallery: sf.gallery.filter((_, j) => j !== i) })} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 grid place-items-center"><X className="w-3.5 h-3.5 text-white" /></button>
              </div>
            ))}
            {sf.gallery.length < 8 && (
              <button type="button" disabled={busyImg} onClick={() => galleryInput.current?.click()} className="w-24 h-24 rounded-xl border border-dashed border-slate-700 text-slate-400 text-[11px] flex flex-col items-center justify-center gap-1 hover:border-slate-500">
                <ImagePlus className="w-5 h-5" /> {t.addPhoto}
              </button>
            )}
            <input ref={galleryInput} type="file" accept="image/*" className="hidden" onChange={(e) => { upload(e.target.files?.[0], 'gallery'); e.target.value = ''; }} />
          </div>
        </div>
        <div>
          <span className={label}>{t.plans}</span>
          <div className="space-y-2">
            {sf.plans.map((p, i) => (
              <div key={p.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3 grid grid-cols-2 gap-2">
                <input className={`${field} col-span-2`} placeholder={t.planName} value={p.name} maxLength={60} onChange={(e) => updPlan(i, { name: e.target.value })} />
                <input className={field} placeholder={t.price} value={p.price} maxLength={40} onChange={(e) => updPlan(i, { price: e.target.value })} />
                <input className={field} placeholder={t.period} value={p.period} maxLength={30} onChange={(e) => updPlan(i, { period: e.target.value })} />
                <input className={`${field} col-span-2`} placeholder={t.desc} value={p.description} maxLength={300} onChange={(e) => updPlan(i, { description: e.target.value })} />
                <div className="col-span-2 flex items-center justify-between">
                  <button type="button" onClick={() => upd({ plans: sf.plans.map((x, j) => ({ ...x, highlight: j === i ? !x.highlight : false })) })} className={`inline-flex items-center gap-1.5 text-xs font-semibold ${p.highlight ? 'text-amber-300' : 'text-slate-400'}`}>
                    <Star className={`w-3.5 h-3.5 ${p.highlight ? 'fill-current' : ''}`} /> {t.highlight}
                  </button>
                  <button type="button" onClick={() => upd({ plans: sf.plans.filter((_, j) => j !== i) })} className="text-xs text-rose-300 inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> {t.remove}</button>
                </div>
              </div>
            ))}
            {sf.plans.length < 8 && (
              <button type="button" onClick={() => upd({ plans: [...sf.plans, { id: storefrontApi.newId('plan'), name: '', price: '', period: '', description: '' }] })} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-white">
                <Plus className="w-3.5 h-3.5" /> {t.addPlan}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* loja */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3.5">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span className="text-brand-primary"><ShoppingBag className="w-4 h-4" /></span> {t.shop}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">{t.shopHint}</p>
        </div>
        <Toggle label={t.shopOn} checked={sf.shopEnabled} onChange={(v) => upd({ shopEnabled: v })} />
        <div className="space-y-2">
          {sf.products.map((p, i) => (
            <div key={p.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3 flex gap-3">
              <label className="w-20 h-20 shrink-0 rounded-xl border border-slate-800 bg-slate-900 overflow-hidden grid place-items-center cursor-pointer" title={t.photo}>
                {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-slate-600" />}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { upload(e.target.files?.[0], 'product', i); e.target.value = ''; }} />
              </label>
              <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
                <input className={`${field} col-span-2`} placeholder={t.productName} value={p.name} maxLength={80} onChange={(e) => updProd(i, { name: e.target.value })} />
                <input className={field} placeholder={t.price} value={p.price} maxLength={40} onChange={(e) => updProd(i, { price: e.target.value })} />
                <input className={field} placeholder={t.category} value={p.category} maxLength={40} onChange={(e) => updProd(i, { category: e.target.value })} />
                <input className={`${field} col-span-2`} placeholder={t.desc} value={p.description} maxLength={300} onChange={(e) => updProd(i, { description: e.target.value })} />
                <div className="col-span-2 flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                    <input type="checkbox" checked={p.available} onChange={(e) => updProd(i, { available: e.target.checked })} /> {t.available}
                  </label>
                  <button type="button" onClick={() => upd({ products: sf.products.filter((_, j) => j !== i) })} className="text-xs text-rose-300 inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> {t.remove}</button>
                </div>
              </div>
            </div>
          ))}
          {sf.products.length < 40 && (
            <button type="button" onClick={() => upd({ products: [...sf.products, { id: storefrontApi.newId('prod'), name: '', price: '', category: '', description: '', imageUrl: '', available: true }] })} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-white">
              <Plus className="w-3.5 h-3.5" /> {t.addProduct}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button type="button" onClick={save} disabled={status === 'saving' || busyImg} className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            <Save className="w-4 h-4" /> {status === 'saving' ? t.saving : t.save}
          </button>
          {status === 'saved' && <span className="text-sm text-emerald-300">{t.saved}</span>}
          {status !== 'idle' && status !== 'saving' && status !== 'saved' && <span className="text-sm text-rose-300">{status}</span>}
        </div>
      </section>
    </>
  );
};

function Toggle({ label: text, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-200">{text}</span>
      <input type="checkbox" className="w-5 h-5" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
