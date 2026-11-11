import React, { useEffect, useRef, useState } from 'react';
import { Camera, Plus, Trash2, Columns2, Lock } from 'lucide-react';
import { photosApi, compressImage, type ProgressPhoto } from '../../services/photos';
import { useLanguage } from '../../i18n/LanguageContext';
import { useX } from '../../i18n/extraStrings';
import { Sheet, useToast } from '../common/ui';

/** Fotos de evolução com comparação antes/depois deslizando. */
export const ProgressPhotos: React.FC<{ studentId: string; readOnly?: boolean }> = ({ studentId, readOnly }) => {
  const x = useX();
  const { formatDate } = useLanguage();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<ProgressPhoto | null>(null);
  const [compare, setCompare] = useState(false);
  const [toast, showToast] = useToast();
  const input = useRef<HTMLInputElement>(null);

  const reload = () => photosApi.list(studentId).then(setPhotos).catch(() => setPhotos([]));
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const data = await compressImage(file);
      await photosApi.add(studentId, data);
      showToast(x.pro.photoSaved);
      await reload();
    } catch (e) {
      showToast(String((e as Error).message || e), 'warn');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  const fmt = (d: string) => formatDate(`${d}T12:00:00`, { day: '2-digit', month: 'short', year: '2-digit' });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5" data-testid="progress-photos">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Camera className="w-4 h-4 text-brand-primary" />
          {x.pro.photos}
        </h3>
        {photos.length >= 2 && (
          <button
            type="button"
            onClick={() => setCompare(true)}
            className="text-[11px] font-bold text-brand-primary flex items-center gap-1"
          >
            <Columns2 className="w-3.5 h-3.5" />
            {x.pro.compare}
          </button>
        )}
      </div>
      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
        <Lock className="w-3 h-3" />
        {x.pro.photoPrivate}
      </p>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {photos.map((p) => (
          <button key={p.id} type="button" onClick={() => setOpen(p)} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-950">
            <img src={p.url} alt={fmt(p.date)} className="w-full h-full object-cover" loading="lazy" />
            <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] text-white font-bold py-0.5">{fmt(p.date)}</span>
          </button>
        ))}
        {!readOnly && (
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="aspect-[3/4] rounded-xl border-2 border-dashed border-slate-700 text-slate-400 flex flex-col items-center justify-center gap-1 text-[11px] font-bold disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            {x.pro.addPhoto}
          </button>
        )}
      </div>
      {!photos.length && <p className="text-xs text-slate-500 mt-2">{x.pro.photosEmpty}</p>}
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label={x.pro.addPhoto}
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      <Sheet open={!!open} onClose={() => setOpen(null)} title={<h3 className="text-base font-black text-white">{open && fmt(open.date)}</h3>}>
        {open && (
          <div className="space-y-3">
            <img src={open.url} alt={fmt(open.date)} className="w-full rounded-2xl" />
            {!readOnly && (
              <button
                type="button"
                onClick={async () => {
                  await photosApi.remove(studentId, open.id);
                  setOpen(null);
                  reload();
                }}
                className="w-full py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-bold flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {x.pro.deletePhoto}
              </button>
            )}
          </div>
        )}
      </Sheet>

      <Sheet open={compare} onClose={() => setCompare(false)} tall title={<h3 className="text-base font-black text-white">{x.pro.compare}</h3>}>
        {compare && photos.length >= 2 && <BeforeAfter photos={photos} fmt={fmt} />}
      </Sheet>
      {toast}
    </div>
  );
};

const BeforeAfter: React.FC<{ photos: ProgressPhoto[]; fmt: (d: string) => string }> = ({ photos, fmt }) => {
  const x = useX();
  const [a, setA] = useState(photos[0].id);
  const [b, setB] = useState(photos[photos.length - 1].id);
  const [pos, setPos] = useState(50);
  const before = photos.find((p) => p.id === a)!;
  const after = photos.find((p) => p.id === b)!;
  const sel = 'flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white';
  return (
    <div className="space-y-3" data-testid="before-after">
      <div className="flex gap-2">
        <select className={sel} value={a} onChange={(e) => setA(e.target.value)} aria-label={x.pro.before}>
          {photos.map((p) => (
            <option key={p.id} value={p.id}>
              {x.pro.before}: {fmt(p.date)}
            </option>
          ))}
        </select>
        <select className={sel} value={b} onChange={(e) => setB(e.target.value)} aria-label={x.pro.after}>
          {photos.map((p) => (
            <option key={p.id} value={p.id}>
              {x.pro.after}: {fmt(p.date)}
            </option>
          ))}
        </select>
      </div>
      <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-slate-950 select-none">
        <img src={after.url} alt={x.pro.after} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <img src={before.url} alt={x.pro.before} className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }} />
        <span className="absolute top-2 left-2 text-[10px] font-black uppercase bg-black/60 text-white px-2 py-0.5 rounded">{x.pro.before}</span>
        <span className="absolute top-2 right-2 text-[10px] font-black uppercase bg-black/60 text-white px-2 py-0.5 rounded">{x.pro.after}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={x.pro.compare}
        className="w-full accent-[var(--brand-primary)]"
      />
    </div>
  );
};
