import React, { useEffect, useState } from 'react';
import { CalendarDays, ChevronRight, Clock, MapPin, Users } from 'lucide-react';
import { extrasApi, ClassOccurrence, localDay } from '../../services/extrasApi';
import { useLanguage } from '../../i18n/LanguageContext';
import { useBi, useX } from '../../i18n/extraStrings';

/** Card "Sua próxima aula" da tela inicial do aluno. */
export const NextClassCard: React.FC<{ studentId: string; onOpen: () => void }> = ({ studentId, onOpen }) => {
  const x = useX();
  const bi = useBi();
  const { formatDate } = useLanguage();
  const [next, setNext] = useState<ClassOccurrence | null | undefined>(undefined);

  useEffect(() => {
    void extrasApi.getMyUpcoming(studentId).then((l) => setNext(l[0] ?? null));
  }, [studentId]);

  if (next === undefined) return null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-center gap-3 hover:border-slate-700 transition"
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: next ? `${next.cls.color}26` : 'rgba(var(--brand-primary-rgb),0.12)' }}
      >
        <CalendarDays className="w-5 h-5" style={{ color: next ? next.cls.color : 'var(--brand-primary)' }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          {next ? x.classes.nextClass : x.classes.title}
        </div>
        {next ? (
          <>
            <div className="text-sm font-extrabold text-white truncate">{bi(next.cls.name)}</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {next.date === localDay() ? x.classes.today : formatDate(next.date, { weekday: 'short', day: '2-digit' })} · {next.cls.time}
              </span>
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3" />
                {bi(next.cls.room)}
              </span>
            </div>
          </>
        ) : (
          <div className="text-xs text-slate-300">{x.classes.subtitle}</div>
        )}
      </div>
      <span className="text-[11px] font-bold text-brand-primary flex items-center shrink-0">
        {x.classes.seeSchedule}
        <ChevronRight className="w-4 h-4" />
      </span>
    </button>
  );
};

/** Card "Aulas de hoje" do painel do professor. */
export const TodayClassesCard: React.FC<{ onOpen: () => void }> = ({ onOpen }) => {
  const x = useX();
  const bi = useBi();
  const [list, setList] = useState<ClassOccurrence[]>([]);

  useEffect(() => {
    void extrasApi.getClassesForDate(localDay()).then(setList);
  }, []);

  const booked = list.reduce((a, c) => a + c.booked, 0);
  const cap = list.reduce((a, c) => a + c.cls.capacity, 0);
  const upcoming = list.filter((c) => !c.isPast).slice(0, 3);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-brand-primary" />
          {x.classes.todayClasses}
        </h3>
        <button type="button" onClick={onOpen} className="text-[11px] font-bold text-brand-primary flex items-center">
          {x.classes.seeSchedule}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3">
          <div className="text-[10px] uppercase font-bold text-slate-500">{x.nav.classes}</div>
          <div className="text-xl font-black text-white">{list.length}</div>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3">
          <div className="text-[10px] uppercase font-bold text-slate-500">{x.classes.occupancy}</div>
          <div className="text-xl font-black text-white">{cap ? Math.round((booked / cap) * 100) : 0}%</div>
        </div>
      </div>
      <div className="space-y-1.5">
        {upcoming.map((o) => (
          <div key={o.cls.id} className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <span className="text-xs font-black text-white tabular-nums w-11">{o.cls.time}</span>
            <span className="w-1 h-5 rounded-full" style={{ backgroundColor: o.cls.color }} />
            <span className="text-xs font-semibold text-slate-200 flex-1 truncate">{bi(o.cls.name)}</span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1 tabular-nums">
              <Users className="w-3 h-3" />
              {o.booked}/{o.cls.capacity}
            </span>
          </div>
        ))}
        {upcoming.length === 0 && <p className="text-xs text-slate-500">{x.classes.none}</p>}
      </div>
    </div>
  );
};
