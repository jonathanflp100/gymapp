import React, { useCallback, useEffect, useMemo, useState } from 'react';
import qrcode from 'qrcode-generator';
import { Megaphone, Target, QrCode, Plus, Trash2, Pin, Award, Users, X, Maximize2 } from 'lucide-react';
import type { Announcement, Challenge, ChallengeMetric, CheckinStats } from '../../types';
import { engagement, checkinUrl } from '../../services/engagementApi';
import { useLanguage } from '../../i18n/LanguageContext';
import { useBi, useX } from '../../i18n/extraStrings';
import { useBrand } from '../../context/BrandContext';
import { Sheet, useToast } from '../../components/common/ui';

type Section = 'ann' | 'ch' | 'chk';

const input =
  'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary';
const label = 'block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1';
const primaryBtn =
  'w-full py-3 rounded-2xl bg-brand-primary text-white text-sm font-black disabled:opacity-50 active:scale-[0.98] transition';

const thisMonth = () => new Date().toISOString().slice(0, 7);

export const EngagementView: React.FC<{ initialSection?: Section }> = ({ initialSection = 'ann' }) => {
  const x = useX();
  const [section, setSection] = useState<Section>(initialSection);
  const [toast, showToast] = useToast();

  const tabs: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'ann', label: x.engage.tabs.ann, icon: <Megaphone className="w-4 h-4" /> },
    { id: 'ch', label: x.engage.tabs.ch, icon: <Target className="w-4 h-4" /> },
    { id: 'chk', label: x.engage.tabs.chk, icon: <QrCode className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-4 pb-28 animate-fadeIn">
      <div>
        <h2 className="text-xl font-black text-white">{x.engage.title}</h2>
        <p className="text-xs text-slate-400">{x.engage.subtitle}</p>
      </div>
      <div className="grid grid-cols-3 gap-1 bg-slate-900 border border-slate-800 rounded-2xl p-1" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={section === t.id}
            onClick={() => setSection(t.id)}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${
              section === t.id ? 'bg-brand-primary text-white' : 'text-slate-400'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
      {section === 'ann' && <AnnouncementsAdmin toast={showToast} />}
      {section === 'ch' && <ChallengesAdmin toast={showToast} />}
      {section === 'chk' && <CheckinAdmin />}
      {toast}
    </div>
  );
};

// ------------------------------------------------------------------ Avisos

const AnnouncementsAdmin: React.FC<{ toast: (m: string, tone?: 'ok' | 'warn') => void }> = ({ toast }) => {
  const x = useX();
  const { formatDate } = useLanguage();
  const [list, setList] = useState<Announcement[] | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', kind: 'info' as Announcement['kind'], pinned: false, expiresAt: '' });
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => engagement.announcements().then(setList).catch(() => setList([])), []);
  useEffect(() => {
    reload();
  }, [reload]);

  const submit = async () => {
    if (!form.title.trim()) return;
    setBusy(true);
    try {
      await engagement.postAnnouncement({
        title: form.title.trim(),
        body: form.body.trim(),
        kind: form.kind,
        pinned: form.pinned,
        expiresAt: form.expiresAt || null,
      });
      toast(x.engage.published);
      setOpen(false);
      setForm({ title: '', body: '', kind: 'info', pinned: false, expiresAt: '' });
      reload();
    } catch (e) {
      toast(String((e as Error).message || e), 'warn');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <button type="button" onClick={() => setOpen(true)} className={`${primaryBtn} flex items-center justify-center gap-2`}>
        <Plus className="w-4 h-4" />
        {x.engage.newAnn}
      </button>
      {list && !list.length && <p className="text-sm text-slate-500 text-center py-6">{x.engage.annEmpty}</p>}
      {list?.map((a) => (
        <div key={a.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {x.engage.annKind[a.kind]}
              </span>
              {a.pinned && <Pin className="w-3 h-3 text-brand-primary" aria-label={x.engage.pinned} />}
              <h4 className="text-sm font-extrabold text-white">{a.title}</h4>
            </div>
            {a.body && <p className="text-xs text-slate-400 mt-1">{a.body}</p>}
            <div className="text-[10px] text-slate-500 mt-1.5">
              {a.authorName} · {formatDate(a.createdAt, { day: '2-digit', month: 'short' })}
              {a.expiresAt && ` → ${formatDate(a.expiresAt, { day: '2-digit', month: 'short' })}`}
            </div>
          </div>
          <button
            type="button"
            aria-label={x.engage.remove}
            onClick={async () => {
              await engagement.deleteAnnouncement(a.id);
              reload();
            }}
            className="self-start p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      <Sheet open={open} onClose={() => setOpen(false)} title={<h3 className="text-base font-black text-white">{x.engage.newAnn}</h3>}>
        <div className="space-y-3">
          <div>
            <label className={label} htmlFor="ann-title">
              {x.engage.annTitleField}
            </label>
            <input id="ann-title" className={input} maxLength={80} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className={label} htmlFor="ann-body">
              {x.engage.annBody}
            </label>
            <textarea id="ann-body" rows={3} className={input} maxLength={500} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['info', 'promo', 'alert'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setForm({ ...form, kind: k })}
                className={`py-2 rounded-xl text-xs font-bold border ${
                  form.kind === k ? 'border-brand-primary bg-brand-primary-subtle text-white' : 'border-slate-800 text-slate-400'
                }`}
              >
                {x.engage.annKind[k]}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} className="accent-[var(--brand-primary)]" />
            {x.engage.pin}
          </label>
          <div>
            <label className={label} htmlFor="ann-exp">
              {x.engage.expires}
            </label>
            <input id="ann-exp" type="date" className={input} value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          </div>
          <button type="button" disabled={busy || !form.title.trim()} onClick={submit} className={primaryBtn}>
            {x.engage.publish}
          </button>
        </div>
      </Sheet>
    </div>
  );
};

// ------------------------------------------------------------------ Desafios

const ChallengesAdmin: React.FC<{ toast: (m: string, tone?: 'ok' | 'warn') => void }> = ({ toast }) => {
  const x = useX();
  const bi = useBi();
  const [list, setList] = useState<Challenge[] | null>(null);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Challenge | null>(null);
  const empty = { name: '', nameEs: '', reward: '', metric: 'workouts' as ChallengeMetric, target: 12, month: thisMonth() };
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => engagement.challenges(true).then(setList).catch(() => setList([])), []);
  useEffect(() => {
    reload();
  }, [reload]);

  const submit = async () => {
    if (!form.name.trim() || form.target < 1) return;
    setBusy(true);
    try {
      await engagement.createChallenge({
        title: { 'pt-BR': form.name.trim(), 'es-PY': form.nameEs.trim() || form.name.trim() },
        reward: { 'pt-BR': form.reward.trim(), 'es-PY': form.reward.trim() },
        metric: form.metric,
        target: Math.round(form.target),
        month: form.month,
      });
      toast(x.engage.created);
      setOpen(false);
      setForm(empty);
      reload();
    } catch (e) {
      toast(String((e as Error).message || e), 'warn');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <button type="button" onClick={() => setOpen(true)} className={`${primaryBtn} flex items-center justify-center gap-2`}>
        <Plus className="w-4 h-4" />
        {x.engage.newCh}
      </button>
      {list && !list.length && <p className="text-sm text-slate-500 text-center py-6">{x.engage.chEmpty}</p>}
      {list?.map((c) => (
        <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
          <div className="flex items-start gap-3">
            <button type="button" onClick={() => setDetail(c)} className="min-w-0 flex-1 text-left">
              <h4 className="text-sm font-extrabold text-white">{bi(c.title)}</h4>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {x.engage.metrics[c.metric]}: {c.target} · {c.month}
                {bi(c.reward) && ` · ${x.engage.reward}: ${bi(c.reward)}`}
              </div>
              <div className="flex gap-3 mt-2 text-[11px]">
                <span className="flex items-center gap-1 text-slate-300">
                  <Users className="w-3.5 h-3.5" />
                  {c.participants ?? 0} {x.engage.participants}
                </span>
                <span className="flex items-center gap-1 text-amber-300 font-bold">
                  <Award className="w-3.5 h-3.5" />
                  {c.completedBy?.length ?? 0} {x.engage.winners}
                </span>
              </div>
            </button>
            <button
              type="button"
              aria-label={x.engage.remove}
              onClick={async () => {
                await engagement.deleteChallenge(c.id);
                reload();
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      <Sheet open={!!detail} onClose={() => setDetail(null)} title={<h3 className="text-base font-black text-white">{detail && bi(detail.title)}</h3>}>
        {detail && (
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {detail.completedBy?.length ?? 0} {x.engage.winners}
            </div>
            {detail.completedBy?.map((m) => (
              <div key={m.id} className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-white">{m.name}</span>
              </div>
            ))}
          </div>
        )}
      </Sheet>

      <Sheet open={open} onClose={() => setOpen(false)} title={<h3 className="text-base font-black text-white">{x.engage.newCh}</h3>}>
        <div className="space-y-3">
          <div>
            <label className={label} htmlFor="ch-name">
              {x.engage.chName}
            </label>
            <input id="ch-name" className={input} maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className={label} htmlFor="ch-name-es">
              {x.engage.chNameEs}
            </label>
            <input id="ch-name-es" className={input} maxLength={60} value={form.nameEs} onChange={(e) => setForm({ ...form, nameEs: e.target.value })} />
          </div>
          <div>
            <span className={label}>{x.engage.chMetric}</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(['workouts', 'checkins', 'classes'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm({ ...form, metric: m })}
                  className={`py-2 rounded-xl text-xs font-bold border ${
                    form.metric === m ? 'border-brand-primary bg-brand-primary-subtle text-white' : 'border-slate-800 text-slate-400'
                  }`}
                >
                  {x.engage.metrics[m]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={label} htmlFor="ch-target">
                {x.engage.chTarget}
              </label>
              <input
                id="ch-target"
                type="number"
                min={1}
                max={100}
                className={input}
                value={form.target}
                onChange={(e) => setForm({ ...form, target: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className={label} htmlFor="ch-month">
                {x.engage.chMonth}
              </label>
              <input id="ch-month" type="month" className={input} value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={label} htmlFor="ch-reward">
              {x.engage.chReward}
            </label>
            <input id="ch-reward" className={input} maxLength={60} value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })} />
          </div>
          <button type="button" disabled={busy || !form.name.trim() || form.target < 1} onClick={submit} className={primaryBtn}>
            {x.engage.create}
          </button>
        </div>
      </Sheet>
    </div>
  );
};

// ------------------------------------------------------------------ Check-in

const CheckinAdmin: React.FC = () => {
  const x = useX();
  const { language } = useLanguage();
  const [stats, setStats] = useState<CheckinStats | null>(null);
  const [reception, setReception] = useState(false);

  useEffect(() => {
    engagement.checkinStats().then(setStats).catch(() => setStats({ days: [], today: [] }));
  }, [reception]);

  const max = Math.max(1, ...(stats?.days.map((d) => d.count) ?? [1]));
  const weekday = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(language, { weekday: 'short' }).replace('.', '');
  const time = (iso: string) => new Date(iso).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-3">
      <button type="button" onClick={() => setReception(true)} className={`${primaryBtn} flex items-center justify-center gap-2`}>
        <Maximize2 className="w-4 h-4" />
        {x.engage.reception}
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">{x.engage.chkWeek}</h4>
        <div className="flex items-end gap-2 h-28" role="img" aria-label={x.engage.chkWeek}>
          {stats?.days.map((d, i) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-[10px] font-bold text-slate-300 tabular-nums">{d.count}</span>
              <div
                className="w-full rounded-t-md"
                style={{
                  height: `${Math.max(4, (d.count / max) * 100)}%`,
                  background: i === stats.days.length - 1 ? 'var(--brand-primary)' : 'rgb(51 65 85)',
                }}
              />
              <span className="text-[10px] text-slate-500 capitalize">{weekday(d.date)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
          {x.engage.chkToday} ({stats?.today.length ?? 0})
        </h4>
        {stats && !stats.today.length && <p className="text-xs text-slate-500">{x.engage.chkNone}</p>}
        <div className="divide-y divide-slate-800">
          {stats?.today.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2">
              <span className="text-sm text-white">{p.name}</span>
              <span className="text-xs text-slate-400 tabular-nums">{time(p.at)}</span>
            </div>
          ))}
        </div>
      </div>

      {reception && <ReceptionMode onClose={() => setReception(false)} />}
    </div>
  );
};

/** Tela cheia para tablet/TV na recepção: QR do dia + contador ao vivo. */
const ReceptionMode: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const x = useX();
  const { brand } = useBrand();
  const [code, setCode] = useState<{ code: string; count: number } | null>(null);

  useEffect(() => {
    let alive = true;
    const tick = () =>
      engagement
        .checkinCode()
        .then((c) => alive && setCode({ code: c.code, count: c.count }))
        .catch(() => undefined);
    tick();
    const id = setInterval(tick, 15_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const svg = useMemo(() => {
    if (!code) return '';
    const qr = qrcode(0, 'M');
    qr.addData(checkinUrl(code.code));
    qr.make();
    return qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
  }, [code]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-center" role="dialog" aria-modal="true">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-300"
      >
        <X className="w-4 h-4" />
        {x.engage.exit}
      </button>
      {brand.logoUrl ? (
        <img src={brand.logoUrl} alt={brand.name} className="h-14 mb-4 object-contain" />
      ) : (
        <div className="text-lg font-black text-brand-primary mb-4">{brand.name}</div>
      )}
      <h2 className="text-3xl font-black text-white">{x.engage.receptionTitle}</h2>
      <p className="text-sm text-slate-400 mt-1 mb-6">{x.engage.receptionHint}</p>
      <div
        className="bg-white rounded-3xl p-4 w-[min(78vw,340px)] aspect-square [&>svg]:w-full [&>svg]:h-full"
        data-testid="reception-qr"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {code && <div className="mt-6 text-lg font-extrabold text-white tabular-nums">{x.engage.receptionCount(code.count)}</div>}
    </div>
  );
};
