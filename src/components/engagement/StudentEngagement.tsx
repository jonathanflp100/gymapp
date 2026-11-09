import React, { useEffect, useState } from 'react';
import { Megaphone, Tag, AlertTriangle, Pin, QrCode, CheckCircle2, Target, Award, Bell, ChevronRight } from 'lucide-react';
import type { Announcement, Challenge } from '../../types';
import { engagement } from '../../services/engagementApi';
import { extrasApi, localDay } from '../../services/extrasApi';
import { REAL_BACKEND } from '../../services/openGymBackend';
import { useLanguage } from '../../i18n/LanguageContext';
import { useBi, useX } from '../../i18n/extraStrings';
import { Sheet, useToast } from '../common/ui';

const KIND_STYLE: Record<Announcement['kind'], { icon: React.ReactNode; cls: string }> = {
  info: { icon: <Megaphone className="w-4 h-4" />, cls: 'text-sky-300 bg-sky-500/10 border-sky-500/25' },
  promo: { icon: <Tag className="w-4 h-4" />, cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25' },
  alert: { icon: <AlertTriangle className="w-4 h-4" />, cls: 'text-amber-300 bg-amber-500/10 border-amber-500/25' },
};

/** Avisos da academia na tela inicial: os 2 mais importantes, "ver todos" abre o mural. */
export const AnnouncementsCard: React.FC = () => {
  const x = useX();
  const { formatDate } = useLanguage();
  const [list, setList] = useState<Announcement[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    engagement.announcements().then(setList).catch(() => setList([]));
  }, []);

  if (!list.length) return null;

  const Item: React.FC<{ a: Announcement; full?: boolean }> = ({ a, full }) => (
    <div className={`rounded-2xl border p-3 ${KIND_STYLE[a.kind].cls}`}>
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0">{KIND_STYLE[a.kind].icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-extrabold text-white">{a.title}</h4>
            {a.pinned && <Pin className="w-3 h-3 text-white/60 shrink-0" aria-label={x.engage.pinned} />}
          </div>
          {a.body && <p className={`text-[11px] text-slate-300 mt-0.5 ${full ? '' : 'line-clamp-2'}`}>{a.body}</p>}
          <div className="text-[10px] text-slate-500 mt-1">
            {a.authorName} · {formatDate(a.createdAt, { day: '2-digit', month: 'short' })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Megaphone className="w-3.5 h-3.5 text-brand-primary" />
          {x.engage.annTitle}
        </h3>
        {list.length > 2 && (
          <button type="button" onClick={() => setOpen(true)} className="text-[11px] font-bold text-brand-primary flex items-center">
            {x.engage.seeAll} ({list.length})
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {list.slice(0, 2).map((a) => (
        <Item key={a.id} a={a} />
      ))}
      <Sheet open={open} onClose={() => setOpen(false)} title={<h3 className="text-base font-black text-white">{x.engage.annTitle}</h3>}>
        <div className="space-y-2">
          {list.map((a) => (
            <Item key={a.id} a={a} full />
          ))}
        </div>
      </Sheet>
    </div>
  );
};

/** Status do check-in do dia. Na demo, permite simular a leitura do QR. */
export const CheckinCard: React.FC<{ refreshKey?: number }> = ({ refreshKey }) => {
  const x = useX();
  const { language } = useLanguage();
  const [at, setAt] = useState<string | null | undefined>(undefined);
  const [toast, showToast] = useToast();

  useEffect(() => {
    engagement.checkedInToday().then(setAt);
  }, [refreshKey]);

  if (at === undefined) return null;
  const time = (iso: string) => new Date(iso).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className={`rounded-3xl border p-4 flex items-center gap-3 ${
        at ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-slate-900 border-slate-800'
      }`}
    >
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${at ? 'bg-emerald-500/20 text-emerald-300' : 'bg-brand-primary-subtle text-brand-primary'}`}>
        {at ? <CheckCircle2 className="w-6 h-6" /> : <QrCode className="w-6 h-6" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{x.engage.chkTitle}</div>
        {at ? (
          <div className="text-sm font-extrabold text-emerald-300">{x.engage.chkDone(time(at))}</div>
        ) : (
          <>
            <p className="text-xs text-slate-300">{x.engage.chkTodo}</p>
            {!REAL_BACKEND && (
              <button
                type="button"
                onClick={async () => {
                  const r = await engagement.checkin('DEMO');
                  setAt(r.at);
                  showToast(r.already ? x.engage.chkAlready : x.engage.chkOk);
                }}
                className="mt-2 text-[11px] font-bold text-brand-primary underline underline-offset-2"
              >
                {x.engage.chkSimulate}
              </button>
            )}
          </>
        )}
      </div>
      {toast}
    </div>
  );
};

/** Desafios do mês com barra de progresso e selo. */
export const ChallengesCard: React.FC = () => {
  const x = useX();
  const bi = useBi();
  const [list, setList] = useState<Challenge[]>([]);

  useEffect(() => {
    engagement.challenges().then(setList).catch(() => setList([]));
  }, []);

  if (!list.length) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <Target className="w-3.5 h-3.5 text-brand-primary" />
        {x.engage.chTitle}
      </h3>
      {list.map((c) => {
        const pct = Math.round((c.progress / c.target) * 100);
        return (
          <div key={c.id}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 min-w-0">
                {c.done && <Award className="w-4 h-4 text-amber-400 shrink-0" />}
                <span className="truncate">{bi(c.title)}</span>
              </span>
              <span className={`text-[11px] font-black tabular-nums ${c.done ? 'text-amber-300' : 'text-slate-300'}`}>
                {x.engage.progress(c.progress, c.target)}
              </span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: c.done ? '#f59e0b' : 'var(--brand-primary)' }}
              />
            </div>
            <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
              <span>{x.engage.metrics[c.metric]}</span>
              {bi(c.reward) && (
                <span className="text-slate-400">
                  {x.engage.reward}: {bi(c.reward)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Lembrete mais útil do momento, no topo da tela inicial. */
export const ReminderBanner: React.FC<{ studentId: string; lastWorkoutDate?: string; streakDays?: number }> = ({
  studentId,
  lastWorkoutDate,
  streakDays = 0,
}) => {
  const x = useX();
  const bi = useBi();
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      // 1. Aula reservada para hoje
      try {
        const mine = await extrasApi.getMyUpcoming(studentId);
        const today = mine.find((o) => o.date === localDay());
        if (today && alive) return setText(x.remind.classToday(bi(today.cls.name), today.cls.time));
      } catch {
        /* segue */
      }
      // 2. Dias sem treinar
      if (lastWorkoutDate && streakDays === 0) {
        const days = Math.floor((Date.now() - Date.parse(lastWorkoutDate)) / 86_400_000);
        if (days >= 3 && alive) return setText(x.remind.idle(days));
      }
      // 3. Desafio quase completo
      try {
        const ch = (await engagement.challenges()).find((c) => !c.done && c.target - c.progress <= 3);
        if (ch && alive) return setText(x.remind.challenge(ch.target - ch.progress, bi(ch.title)));
      } catch {
        /* segue */
      }
      if (alive) setText(null);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, lastWorkoutDate, streakDays]);

  if (!text) return null;
  return (
    <div className="flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 bg-brand-primary-subtle border border-brand-primary/30" role="status">
      <Bell className="w-4 h-4 text-brand-primary shrink-0" />
      <span className="text-xs font-semibold text-white">{text}</span>
    </div>
  );
};
