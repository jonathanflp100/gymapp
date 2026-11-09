import React, { useEffect, useState } from 'react';
import { Trophy, Medal, UserX, MessageCircle, Activity, Dumbbell } from 'lucide-react';
import { REAL_BACKEND } from '../../services/openGymBackend';
import { hub, Ranking, HubStats } from '../../services/hub';
import { MOCK_STUDENTS } from '../../data/mockData';
import { DEMO_TEXT_ES } from '../../data/demoLocaleEs';
import { useLanguage } from '../../i18n/LanguageContext';
import { useX } from '../../i18n/extraStrings';
import { useBrand } from '../../context/BrandContext';
import { Sheet, initials } from './ui';

function seeded(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

/** Ranking de exemplo para a demo, estável durante o mês. */
function demoRanking(meId: string, es: boolean): Ranking {
  const month = new Date().toISOString().slice(0, 7);
  const day = new Date().getDate();
  const rows = MOCK_STUDENTS.map((s) => ({
    id: s.id,
    name: (es ? DEMO_TEXT_ES[s.name] ?? s.name : s.name),
    days: Math.max(1, Math.round(day * (0.25 + seeded(s.id + month) * 0.6))),
  }))
    .sort((a, b) => b.days - a.days)
    .map((r, i) => ({ position: i + 1, id: r.id, name: r.id === meId ? r.name : r.name.split(' ')[0], days: r.days, isMe: r.id === meId }));
  const mine = rows.find((r) => r.isMe);
  return { month, rows, me: mine ? { position: mine.position, days: mine.days, total: rows.length } : null };
}

/** Card do ranking do mês (tela inicial do aluno). */
export const RankingCard: React.FC<{ studentId: string }> = ({ studentId }) => {
  const x = useX();
  const { language } = useLanguage();
  const [data, setData] = useState<Ranking | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (REAL_BACKEND) hub.ranking().then(setData).catch(() => setData(null));
    else setData(demoRanking(studentId, language === 'es-PY'));
  }, [studentId, language]);

  if (!data) return null;
  const top3 = data.rows.slice(0, 3);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left bg-gradient-to-br from-amber-500/15 to-slate-900 border border-amber-500/25 rounded-3xl p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">{x.ranking.title}</span>
          </div>
          <span className="text-[11px] font-bold text-amber-300">{x.ranking.see} →</span>
        </div>
        {data.me ? (
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-black text-white leading-none">{data.me.position}º</span>
            <span className="text-xs text-slate-300 pb-0.5">
              / {data.me.total} · {x.ranking.days(data.me.days)}
            </span>
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-300">{x.ranking.empty}</p>
        )}
        {top3.length > 0 && (
          <div className="mt-3 flex -space-x-2">
            {top3.map((r, i) => (
              <span
                key={r.id}
                className="w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-slate-950"
                style={{ backgroundColor: ['#fbbf24', '#cbd5e1', '#d97706'][i] }}
                title={r.name}
              >
                {initials(r.name)}
              </span>
            ))}
          </div>
        )}
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              {x.ranking.title}
            </h3>
            <span className="text-[11px] text-slate-400">{x.ranking.subtitle}</span>
          </div>
        }
      >
        {data.rows.length === 0 ? (
          <p className="text-xs text-slate-400">{x.ranking.empty}</p>
        ) : (
          <div className="space-y-1.5">
            {data.rows.map((r) => (
              <div
                key={r.id}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 border ${
                  r.isMe ? 'bg-brand-primary-subtle border-brand-primary/40' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <span className="w-7 text-center">
                  {r.position <= 3 ? (
                    <Medal className="w-5 h-5 mx-auto" style={{ color: ['#fbbf24', '#cbd5e1', '#d97706'][r.position - 1] }} />
                  ) : (
                    <span className="text-xs font-black text-slate-500">{r.position}º</span>
                  )}
                </span>
                <span className="text-sm font-bold text-white flex-1 truncate">
                  {r.name}
                  {r.isMe && <span className="ml-2 text-[10px] font-black uppercase text-brand-primary">{x.ranking.you}</span>}
                </span>
                <span className="text-xs font-black text-slate-300 tabular-nums">{x.ranking.days(r.days)}</span>
              </div>
            ))}
          </div>
        )}
      </Sheet>
    </>
  );
};

/** Painel de retenção do professor: quem sumiu e mensagem pronta para chamar de volta. */
export const AtRiskCard: React.FC = () => {
  const x = useX();
  const { brand } = useBrand();
  const { language } = useLanguage();
  const [stats, setStats] = useState<HubStats | null>(null);

  useEffect(() => {
    if (REAL_BACKEND) {
      hub.stats().then(setStats).catch(() => setStats(null));
      return;
    }
    const week = Date.now() - 7 * 86400000;
    const es = language === 'es-PY';
    const atRisk = MOCK_STUDENTS.filter((s) => !s.lastWorkoutDate || Date.parse(s.lastWorkoutDate) < week).map((s) => ({
      id: s.id,
      name: es ? DEMO_TEXT_ES[s.name] ?? s.name : s.name,
      lastWorkoutAt: s.lastWorkoutDate ?? null,
      joinedAt: s.joinDate,
    }));
    setStats({
      students: MOCK_STUDENTS.length,
      active7: MOCK_STUDENTS.length - atRisk.length,
      atRisk,
      workouts7: 23,
      classesToday: 0,
      bookedToday: 0,
      capacityToday: 0,
    });
  }, [language]);

  if (!stats) return null;

  const daysAgo = (iso: string | null) => (iso ? Math.floor((Date.now() - Date.parse(iso)) / 86400000) : null);
  const wa = (name: string) =>
    `https://wa.me/?text=${encodeURIComponent(x.retention.message(name.split(' ')[0], brand.name))}`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3">
          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
            <Activity className="w-3 h-3" />
            {x.retention.active7}
          </div>
          <div className="text-xl font-black text-white">
            {stats.active7}
            <span className="text-xs text-slate-500 font-bold">/{stats.students}</span>
          </div>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3">
          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
            <Dumbbell className="w-3 h-3" />
            {x.retention.workouts7}
          </div>
          <div className="text-xl font-black text-white">{stats.workouts7}</div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
          <UserX className="w-4 h-4 text-amber-400" />
          {x.retention.title}
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">{stats.atRisk.length}</span>
        </h3>
        <p className="text-[11px] text-slate-500">{x.retention.subtitle}</p>
      </div>

      {stats.atRisk.length === 0 ? (
        <p className="text-xs text-emerald-400 font-semibold">{x.retention.none}</p>
      ) : (
        <div className="space-y-1.5">
          {stats.atRisk.slice(0, 6).map((s) => {
            const d = daysAgo(s.lastWorkoutAt);
            return (
              <div key={s.id} className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                <span className="w-7 h-7 rounded-lg bg-slate-800 text-[10px] font-black text-slate-200 flex items-center justify-center shrink-0">
                  {initials(s.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-200 truncate">{s.name}</div>
                  <div className="text-[10px] text-amber-400/90">{d === null ? x.retention.never : x.retention.days(d)}</div>
                </div>
                <a
                  href={wa(s.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={x.retention.send}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
