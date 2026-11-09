import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Trash2, Save, Palette, Phone, Globe, Users, Share2, Copy, Printer, Search, Image as ImageIcon } from 'lucide-react';
import qrcode from 'qrcode-generator';
import { BrandConfig } from '../../types';
import { useBrand } from '../../context/BrandContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useX } from '../../i18n/extraStrings';
import { REAL_BACKEND } from '../../services/openGymBackend';
import { hub, HubMember, HubRole } from '../../services/hub';
import { MOCK_STUDENTS, MOCK_TEACHERS } from '../../data/mockData';
import { generateBrandLogoSvg } from '../../config/brand';
import { useToast, initials } from '../../components/common/ui';

const PALETTE = ['#DC2626', '#EA580C', '#D97706', '#16A34A', '#0D9488', '#0284C7', '#2563EB', '#4F46E5', '#7C3AED', '#DB2777', '#111827', '#B45309'];

type Draft = Pick<
  BrandConfig,
  'name' | 'tagline' | 'logoUrl' | 'primaryColor' | 'secondaryColor' | 'whatsapp' | 'address' | 'defaultLanguage' | 'gymCode'
>;

const pick = (b: BrandConfig): Draft => ({
  name: b.name,
  tagline: b.tagline,
  logoUrl: b.logoUrl || '',
  primaryColor: b.primaryColor,
  secondaryColor: b.secondaryColor,
  whatsapp: b.whatsapp,
  address: b.address,
  defaultLanguage: b.defaultLanguage,
  gymCode: b.gymCode,
});

/** Lê a imagem, recorta no centro e reduz para 256×256 (logo leve para o servidor). */
function resizeImage(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('canvas'));
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('imagem inválida'));
    };
    img.src = url;
  });
}

function qrSvg(text: string): string {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
}

export const SettingsView: React.FC = () => {
  const { brand, saveBrand } = useBrand();
  const { isOwner } = useAuth();
  const { setLanguage } = useLanguage();
  const x = useX();
  const [toast, showToast] = useToast();
  const [draft, setDraft] = useState<Draft>(() => pick(brand));
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(pick(brand)), [brand]);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(pick(brand)), [draft, brand]);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      set('logoUrl', await resizeImage(file));
    } catch {
      showToast('PNG / JPG', 'warn');
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveBrand({ ...draft, accentColor: draft.primaryColor });
      setLanguage(draft.defaultLanguage);
      showToast(x.settings.saved);
    } catch (err) {
      showToast((err as Error).message, 'warn');
    } finally {
      setSaving(false);
    }
  };

  const previewLogo = draft.logoUrl || generateBrandLogoSvg({ ...brand, ...draft } as BrandConfig);
  const field =
    'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary';
  const label = 'text-[11px] font-bold text-slate-400 block mb-1';

  return (
    <div className="space-y-5 pb-40 animate-fadeIn">
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">{x.settings.title}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{x.settings.subtitle}</p>
        {!REAL_BACKEND && <p className="text-[11px] text-amber-400/90 mt-2">{x.settings.demoNote}</p>}
      </div>

      {/* Prévia ao vivo */}
      <div className="rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
        <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: draft.secondaryColor }}>
          <img src={previewLogo} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/10" />
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-white truncate">{draft.name || '—'}</div>
            <div className="text-[11px] text-white/70 truncate">{draft.tagline}</div>
          </div>
          <span className="ml-auto text-[9px] font-black uppercase tracking-wider text-white/60">{x.settings.preview}</span>
        </div>
        <div className="bg-slate-900 p-4 space-y-2.5">
          <div className="h-2 w-2/3 rounded-full bg-slate-800" />
          <div className="h-2 w-1/2 rounded-full bg-slate-800" />
          <div className="py-3 rounded-2xl text-center text-xs font-black text-white shadow-lg" style={{ backgroundColor: draft.primaryColor }}>
            {x.settings.previewButton}
          </div>
        </div>
      </div>

      {/* Identidade */}
      <Section icon={<ImageIcon className="w-4 h-4" />} title={x.settings.identity}>
        <div className="flex items-center gap-4">
          <img src={previewLogo} alt="" className="w-20 h-20 rounded-2xl object-cover border border-slate-700 bg-slate-950" />
          <div className="space-y-2">
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFile} />
            <button
              type="button"
              disabled={!isOwner}
              onClick={() => fileRef.current?.click()}
              className="px-3 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {draft.logoUrl ? x.settings.changeLogo : x.settings.uploadLogo}
            </button>
            {draft.logoUrl && (
              <button type="button" onClick={() => set('logoUrl', '')} className="text-[11px] font-bold text-slate-400 hover:text-red-400 flex items-center gap-1">
                <Trash2 className="w-3 h-3" />
                {x.settings.removeLogo}
              </button>
            )}
            <p className="text-[10px] text-slate-500 max-w-[200px]">{x.settings.logoHint}</p>
          </div>
        </div>
        <label className="block">
          <span className={label}>{x.settings.name}</span>
          <input className={field} value={draft.name} maxLength={80} disabled={!isOwner} onChange={(e) => set('name', e.target.value)} />
        </label>
        <label className="block">
          <span className={label}>{x.settings.tagline}</span>
          <input className={field} value={draft.tagline} maxLength={80} disabled={!isOwner} onChange={(e) => set('tagline', e.target.value)} />
        </label>
        <label className="block">
          <span className={label}>{x.settings.code}</span>
          <input
            className={`${field} font-mono uppercase`}
            value={draft.gymCode}
            maxLength={16}
            disabled={!isOwner}
            onChange={(e) => set('gymCode', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          />
        </label>
      </Section>

      {/* Cores */}
      <Section icon={<Palette className="w-4 h-4" />} title={x.settings.colors}>
        {(
          [
            ['primaryColor', x.settings.primary],
            ['secondaryColor', x.settings.secondary],
          ] as const
        ).map(([key, text]) => (
          <div key={key}>
            <span className={label}>{text}</span>
            <div className="flex items-center gap-2 flex-wrap">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled={!isOwner}
                  aria-label={c}
                  onClick={() => set(key, c)}
                  className={`w-8 h-8 rounded-full border-2 transition ${draft[key].toLowerCase() === c.toLowerCase() ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <label className="w-8 h-8 rounded-full border-2 border-dashed border-slate-600 overflow-hidden relative cursor-pointer" title="Personalizada">
                <input
                  type="color"
                  disabled={!isOwner}
                  value={draft[key]}
                  onChange={(e) => set(key, e.target.value.toUpperCase())}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <span className="absolute inset-1 rounded-full" style={{ backgroundColor: draft[key] }} />
              </label>
              <span className="text-[11px] font-mono text-slate-400">{draft[key]}</span>
            </div>
          </div>
        ))}
      </Section>

      {/* Contato e idioma */}
      <Section icon={<Phone className="w-4 h-4" />} title={x.settings.contact}>
        <label className="block">
          <span className={label}>{x.settings.whatsapp}</span>
          <input className={field} value={draft.whatsapp} inputMode="tel" placeholder="+55 11 99999-0000" disabled={!isOwner} onChange={(e) => set('whatsapp', e.target.value)} />
        </label>
        <label className="block">
          <span className={label}>{x.settings.address}</span>
          <input className={field} value={draft.address} maxLength={160} disabled={!isOwner} onChange={(e) => set('address', e.target.value)} />
        </label>
        <div>
          <span className={label}>
            <Globe className="w-3 h-3 inline -mt-0.5 mr-1" />
            {x.settings.language}
          </span>
          <div className="grid grid-cols-2 gap-2">
            {(['pt-BR', 'es-PY'] as const).map((l) => (
              <button
                key={l}
                type="button"
                disabled={!isOwner}
                onClick={() => set('defaultLanguage', l)}
                className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                  draft.defaultLanguage === l ? 'bg-brand-primary border-transparent text-white' : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                {l === 'pt-BR' ? '🇧🇷 Português' : '🇵🇾 Español'}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <ShareSection name={brand.name} logo={previewLogo} />

      {isOwner && <TeamSection />}

      {/* Barra de salvar */}
      {isOwner && (
        <div className="fixed left-0 right-0 bottom-[76px] z-40 px-4 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving}
              className="w-full py-3.5 rounded-2xl bg-brand-primary text-white text-sm font-black shadow-2xl flex items-center justify-center gap-2 disabled:opacity-0 disabled:translate-y-4 transition-all"
            >
              <Save className="w-4 h-4" />
              {saving ? x.settings.saving : x.settings.save}
            </button>
          </div>
        </div>
      )}
      {toast}
    </div>
  );
};

const Section: React.FC<{ icon: React.ReactNode; title: string; hint?: string; children: React.ReactNode }> = ({
  icon,
  title,
  hint,
  children,
}) => (
  <section className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3.5">
    <div>
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
        <span className="text-brand-primary">{icon}</span>
        {title}
      </h3>
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
    {children}
  </section>
);

/** Link, QR code e cartaz para imprimir e colar na recepção. */
const ShareSection: React.FC<{ name: string; logo: string }> = ({ name, logo }) => {
  const x = useX();
  const [toast, showToast] = useToast();
  const link = typeof window !== 'undefined' ? window.location.origin : '';
  const svg = useMemo(() => qrSvg(link), [link]);

  const printPoster = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const steps = x.settings.posterSteps.map((s, i) => `<li><b>${i + 1}</b><span>${s}</span></li>`).join('');
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${name}</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; text-align: center; margin: 0; }
  .logo { width: 110px; height: 110px; border-radius: 24px; object-fit: cover; margin-top: 8mm; }
  h1 { font-size: 34px; margin: 10px 0 4px; }
  h2 { font-size: 24px; font-weight: 600; margin: 0 0 8mm; color: #333; }
  .qr { width: 95mm; margin: 0 auto; }
  .qr svg { width: 100%; height: auto; }
  .url { font-size: 18px; margin: 4mm 0 10mm; color: #444; word-break: break-all; }
  ol { list-style: none; padding: 0; max-width: 140mm; margin: 0 auto; text-align: left; }
  li { display: flex; gap: 12px; align-items: center; font-size: 20px; margin: 10px 0; }
  li b { width: 38px; height: 38px; border-radius: 50%; background: #111; color: #fff; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
</style></head><body>
<img class="logo" src="${logo}" alt="">
<h1>${name}</h1>
<h2>${x.settings.posterTitle}</h2>
<div class="qr">${svg}</div>
<div class="url">${link}</div>
<ol>${steps}</ol>
<script>window.onload = function () { setTimeout(function () { window.print(); }, 300); };</script>
</body></html>`);
    w.document.close();
  };

  return (
    <Section icon={<Share2 className="w-4 h-4" />} title={x.settings.share} hint={x.settings.shareHint}>
      <div className="flex items-center gap-4">
        <div className="w-28 h-28 shrink-0 bg-white rounded-2xl p-1.5 [&_svg]:w-full [&_svg]:h-full" dangerouslySetInnerHTML={{ __html: svg }} />
        <div className="min-w-0 space-y-2">
          <div className="text-xs font-mono text-slate-300 break-all">{link}</div>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
                showToast(x.settings.copied);
              } catch {
                /* sem permissão */
              }
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5" />
            {x.settings.copy}
          </button>
          <button type="button" onClick={printPoster} className="px-3 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold flex items-center gap-2">
            <Printer className="w-3.5 h-3.5" />
            {x.settings.poster}
          </button>
        </div>
      </div>
      {toast}
    </Section>
  );
};

interface TeamRow {
  id: string;
  name: string;
  role: HubRole;
  status: 'active' | 'inactive';
  lastWorkoutAt?: string | null;
}

/** Equipe: muda papel (aluno/professor/administrador) e ativa/inativa matrícula. */
const TeamSection: React.FC = () => {
  const x = useX();
  const { formatDate } = useLanguage();
  const { hubMember } = useAuth();
  const [rows, setRows] = useState<TeamRow[]>([]);
  const [query, setQuery] = useState('');
  const [toast, showToast] = useToast();

  useEffect(() => {
    if (REAL_BACKEND) {
      hub
        .members()
        .then((list: HubMember[]) =>
          setRows(list.map((m) => ({ id: m.id, name: m.name, role: m.role, status: m.status, lastWorkoutAt: m.stats.lastWorkoutAt })))
        )
        .catch((err) => showToast(err.message, 'warn'));
    } else {
      setRows([
        ...MOCK_TEACHERS.map((t, i) => ({ id: t.id, name: t.name, role: (i === 0 ? 'owner' : 'teacher') as HubRole, status: 'active' as const })),
        ...MOCK_STUDENTS.map((s) => ({ id: s.id, name: s.name, role: 'student' as HubRole, status: s.status, lastWorkoutAt: s.lastWorkoutDate })),
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = async (row: TeamRow, changes: Partial<TeamRow>) => {
    try {
      if (REAL_BACKEND) await hub.updateMember(row.id, changes as Partial<HubMember>);
      setRows((list) => list.map((r) => (r.id === row.id ? { ...r, ...changes } : r)));
    } catch (err) {
      showToast((err as Error).message, 'warn');
    }
  };

  const order: Record<HubRole, number> = { owner: 0, teacher: 1, student: 2 };
  const visible = rows
    .filter((r) => r.name.toLowerCase().includes(query.toLowerCase().trim()))
    .sort((a, b) => order[a.role] - order[b.role] || a.name.localeCompare(b.name));

  return (
    <Section icon={<Users className="w-4 h-4" />} title={`${x.settings.team} (${rows.length})`} hint={x.settings.teamHint}>
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={x.settings.search}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
        />
      </div>
      <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
        {visible.map((r) => {
          const self = r.id === hubMember?.id;
          return (
            <div key={r.id} className={`flex items-center gap-2.5 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 ${r.status === 'inactive' ? 'opacity-60' : ''}`}>
              <span className="w-8 h-8 rounded-xl bg-slate-800 text-[10px] font-black text-slate-200 flex items-center justify-center shrink-0">
                {initials(r.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{r.name}</div>
                <div className="text-[10px] text-slate-500 truncate">
                  {r.status === 'inactive'
                    ? x.settings.inactive
                    : r.lastWorkoutAt
                      ? formatDate(r.lastWorkoutAt, { day: '2-digit', month: 'short' })
                      : '—'}
                </div>
              </div>
              <select
                value={r.role}
                disabled={self}
                onChange={(e) => update(r, { role: e.target.value as HubRole })}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-200 disabled:opacity-60"
              >
                {(['student', 'teacher', 'owner'] as HubRole[]).map((role) => (
                  <option key={role} value={role}>
                    {x.settings.roles[role]}
                  </option>
                ))}
              </select>
              {r.role === 'student' && (
                <button
                  type="button"
                  onClick={() => update(r, { status: r.status === 'active' ? 'inactive' : 'active' })}
                  className="text-[10px] font-bold text-slate-400 hover:text-white px-1"
                >
                  {r.status === 'active' ? x.settings.deactivate : x.settings.activate}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {toast}
    </Section>
  );
};
