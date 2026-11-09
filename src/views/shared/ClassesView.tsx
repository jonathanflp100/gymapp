import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, MapPin, Users, Plus, Flame, Check, Trash2, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useBi, useX } from '../../i18n/extraStrings';
import { extrasApi, ClassOccurrence, localDay } from '../../services/extrasApi';
import { api } from '../../services/api';
import { MOCK_TEACHERS } from '../../data/mockData';
import { DEMO_TEXT_ES } from '../../data/demoLocaleEs';
import { Sheet, useToast, initials } from '../../components/common/ui';
import { Student } from '../../types';

const COLORS = ['#f97316', '#22c55e', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#eab308'];

export const ClassesView: React.FC<{ mode: 'student' | 'teacher' }> = ({ mode }) => {
  const { currentUser } = useAuth();
  const { language, formatDate } = useLanguage();
  const x = useX();
  const bi = useBi();
  const [toast, showToast] = useToast();

  const days = useMemo(() => {
    const base = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d;
    });
  }, []);

  const [selected, setSelected] = useState(localDay());
  const [items, setItems] = useState<ClassOccurrence[]>([]);
  const [mine, setMine] = useState<ClassOccurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ClassOccurrence | null>(null);
  const [attendees, setAttendees] = useState<{ id: string; name: string }[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [creating, setCreating] = useState(false);

  const studentId = mode === 'student' ? currentUser?.id : undefined;

  const teacherName = (id: string, given?: string) => {
    if (given) return given;
    const n = MOCK_TEACHERS.find((t) => t.id === id)?.name ?? '';
    return language === 'es-PY' ? DEMO_TEXT_ES[n] ?? n : n;
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    const [list, my] = await Promise.all([
      extrasApi.getClassesForDate(selected, studentId),
      studentId ? extrasApi.getMyUpcoming(studentId) : Promise.resolve([]),
    ]);
    setItems(list);
    setMine(my);
    setLoading(false);
  }, [selected, studentId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (mode === 'teacher') void api.getStudents().then(setStudents);
  }, [mode]);

  const openDetail = async (o: ClassOccurrence) => {
    setDetail(o);
    setAttendees(mode === 'teacher' ? await extrasApi.getAttendees(o.cls.id, o.date, students) : []);
  };

  const toggleBooking = async (o: ClassOccurrence) => {
    if (!studentId) return;
    setBusyId(o.cls.id + o.date);
    if (o.isBookedByMe) {
      await extrasApi.cancel(o.cls.id, o.date, studentId);
      showToast(x.classes.cancelToast, 'warn');
    } else {
      const res = await extrasApi.book(o.cls.id, o.date, studentId);
      showToast(res.ok ? x.classes.bookedToast : x.classes.fullToast, res.ok ? 'ok' : 'warn');
    }
    setBusyId(null);
    setDetail(null);
    await refresh();
  };

  const dayLabel = (d: Date, i: number) => (i === 0 ? x.classes.today : i === 1 ? x.classes.tomorrow : x.classes.weekdaysShort[d.getDay()]);

  return (
    <div className="space-y-5 pb-28 animate-fadeIn">
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">
          {mode === 'teacher' ? x.classes.teacherTitle : x.classes.title}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">{mode === 'teacher' ? x.classes.teacherSubtitle : x.classes.subtitle}</p>
      </div>

      {/* Minhas reservas */}
      {mode === 'student' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-brand-primary" />
            {x.classes.myBookings}
          </h3>
          {mine.length === 0 ? (
            <p className="text-xs text-slate-500">{x.classes.noBookings}</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {mine.slice(0, 6).map((o) => (
                <button
                  key={o.cls.id + o.date}
                  type="button"
                  onClick={() => openDetail(o)}
                  className="shrink-0 text-left bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 min-w-[140px]"
                  style={{ borderLeft: `3px solid ${o.cls.color}` }}
                >
                  <div className="text-xs font-extrabold text-white truncate">{bi(o.cls.name)}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {o.date === localDay() ? x.classes.today : formatDate(o.date, { weekday: 'short', day: '2-digit' })} · {o.cls.time}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Seletor de dias */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
        {days.map((d, i) => {
          const key = localDay(d);
          const active = key === selected;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={`shrink-0 w-[60px] py-2 rounded-2xl border text-center transition ${
                active ? 'bg-brand-primary border-transparent text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wide opacity-90">{dayLabel(d, i)}</div>
              <div className="text-lg font-black leading-tight">{d.getDate()}</div>
            </button>
          );
        })}
      </div>

      {mode === 'teacher' && (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="w-full py-3 rounded-2xl bg-brand-primary text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition"
        >
          <Plus className="w-4 h-4" />
          {x.classes.newClass}
        </button>
      )}

      {/* Lista de aulas */}
      <div className="space-y-2.5">
        {loading && items.length === 0 && <div className="h-24 rounded-3xl bg-slate-900 animate-pulse" />}
        {!loading && items.length === 0 && (
          <div className="text-center py-10 text-xs text-slate-500 bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl">
            <CalendarDays className="w-6 h-6 mx-auto mb-2 opacity-60" />
            {x.classes.none}
          </div>
        )}
        {items.map((o) => {
          const left = o.cls.capacity - o.booked;
          const pct = Math.min(100, Math.round((o.booked / o.cls.capacity) * 100));
          const full = left <= 0;
          return (
            <div
              key={o.cls.id}
              className={`bg-slate-900 border border-slate-800 rounded-3xl p-4 transition ${o.isPast ? 'opacity-50' : ''}`}
            >
              <button type="button" onClick={() => openDetail(o)} className="w-full text-left flex items-start gap-3">
                <div className="w-12 shrink-0 text-center">
                  <div className="text-sm font-black text-white">{o.cls.time}</div>
                  <div className="text-[10px] text-slate-500">
                    {o.cls.durationMin} {x.classes.min}
                  </div>
                </div>
                <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: o.cls.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-white truncate">{bi(o.cls.name)}</h3>
                    {o.isBookedByMe && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                        {x.classes.booked}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {bi(o.cls.room)}
                    </span>
                    <span>· {teacherName(o.cls.teacherId, o.cls.teacherName)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: full ? '#ef4444' : pct > 80 ? '#f59e0b' : o.cls.color }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold ${full ? 'text-red-400' : 'text-slate-400'}`}>
                      {mode === 'teacher' ? `${o.booked}/${o.cls.capacity}` : full ? x.classes.full : x.classes.spots(left)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 self-center" />
              </button>

              {mode === 'student' && !o.isPast && (
                <button
                  type="button"
                  disabled={busyId === o.cls.id + o.date || (full && !o.isBookedByMe)}
                  onClick={() => toggleBooking(o)}
                  className={`mt-3 w-full py-2.5 rounded-2xl text-xs font-bold transition active:scale-[0.98] disabled:opacity-50 ${
                    o.isBookedByMe
                      ? 'bg-slate-800 text-slate-200'
                      : full
                        ? 'bg-slate-800 text-slate-500'
                        : 'bg-brand-primary text-white shadow-lg'
                  }`}
                >
                  {o.isBookedByMe ? x.classes.cancel : full ? x.classes.full : x.classes.book}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Detalhe da aula */}
      <Sheet
        open={!!detail}
        onClose={() => setDetail(null)}
        title={
          detail && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: detail.cls.color }} />
              <h3 className="text-base font-black text-white truncate">{bi(detail.cls.name)}</h3>
            </div>
          )
        }
      >
        {detail && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">{bi(detail.cls.description)}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Info icon={<CalendarDays className="w-3.5 h-3.5" />} text={formatDate(detail.date, { weekday: 'long', day: '2-digit', month: 'short' })} />
              <Info icon={<Clock className="w-3.5 h-3.5" />} text={`${detail.cls.time} · ${detail.cls.durationMin} ${x.classes.min}`} />
              <Info icon={<MapPin className="w-3.5 h-3.5" />} text={bi(detail.cls.room)} />
              <Info icon={<Flame className="w-3.5 h-3.5" />} text={x.classes.intensity[detail.cls.intensity - 1]} />
              <Info icon={<Users className="w-3.5 h-3.5" />} text={`${detail.booked} ${x.classes.of} ${detail.cls.capacity}`} />
              <Info icon={<span className="text-[9px] font-black">{initials(teacherName(detail.cls.teacherId, detail.cls.teacherName))}</span>} text={teacherName(detail.cls.teacherId, detail.cls.teacherName)} />
            </div>

            {mode === 'student' && !detail.isPast && (
              <button
                type="button"
                onClick={() => toggleBooking(detail)}
                disabled={detail.booked >= detail.cls.capacity && !detail.isBookedByMe}
                className={`w-full py-3 rounded-2xl text-xs font-bold disabled:opacity-50 ${
                  detail.isBookedByMe ? 'bg-slate-800 text-slate-200' : 'bg-brand-primary text-white'
                }`}
              >
                {detail.isBookedByMe ? x.classes.cancel : detail.booked >= detail.cls.capacity ? x.classes.full : x.classes.book}
              </button>
            )}

            {mode === 'teacher' && (
              <>
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    {x.classes.attendees} ({attendees.length})
                  </h4>
                  {attendees.length === 0 ? (
                    <p className="text-xs text-slate-500">{x.classes.noAttendees}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {attendees.map((a, i) => (
                        <div key={a.id + i} className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                          <span className="w-7 h-7 rounded-lg bg-slate-800 text-[10px] font-black text-slate-200 flex items-center justify-center">
                            {initials(a.name)}
                          </span>
                          <span className="text-xs font-semibold text-slate-200 flex-1 truncate">{a.name}</span>
                          <span className="text-[10px] text-slate-500">#{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await extrasApi.deleteClass(detail.cls.id);
                    setDetail(null);
                    await refresh();
                  }}
                  className="w-full py-2.5 rounded-2xl text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {x.classes.remove}
                </button>
              </>
            )}
          </div>
        )}
      </Sheet>

      {/* Nova aula */}
      <NewClassSheet
        open={creating}
        onClose={() => setCreating(false)}
        defaultWeekday={new Date(`${selected}T12:00:00`).getDay()}
        onCreated={async (weekday) => {
          setCreating(false);
          showToast(x.classes.create + ' ✓');
          const target = days.find((d) => d.getDay() === weekday);
          const key = target ? localDay(target) : selected;
          if (key !== selected) setSelected(key); // o efeito recarrega
          else await refresh();
        }}
      />
      {toast}
    </div>
  );
};

const Info: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 min-w-0">
    <span className="text-brand-primary shrink-0 flex items-center">{icon}</span>
    <span className="text-slate-200 font-semibold truncate">{text.charAt(0).toUpperCase() + text.slice(1)}</span>
  </div>
);

const NewClassSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  defaultWeekday: number;
  onCreated: (weekday: number) => void;
}> = ({ open, onClose, defaultWeekday, onCreated }) => {
  const x = useX();
  const [namePt, setNamePt] = useState('');
  const [nameEs, setNameEs] = useState('');
  const [weekday, setWeekday] = useState(defaultWeekday);
  const [time, setTime] = useState('18:00');
  const [duration, setDuration] = useState(50);
  const [capacity, setCapacity] = useState(15);
  const [room, setRoom] = useState('Sala 1');
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    if (open) setWeekday(defaultWeekday);
  }, [open, defaultWeekday]);

  const field = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary';
  const label = 'text-[11px] font-bold text-slate-400 block mb-1';

  const submit = async () => {
    if (!namePt.trim()) return;
    await extrasApi.createClass({
      name: { 'pt-BR': namePt.trim(), 'es-PY': nameEs.trim() || namePt.trim() },
      description: { 'pt-BR': '', 'es-PY': '' },
      weekday,
      time,
      durationMin: duration,
      teacherId: 'teacher-1',
      room: { 'pt-BR': room, 'es-PY': room },
      capacity,
      color,
      intensity: 2,
    });
    setNamePt('');
    setNameEs('');
    onCreated(weekday);
  };

  return (
    <Sheet open={open} onClose={onClose} title={<h3 className="text-base font-black text-white">{x.classes.newClass}</h3>}>
      <div className="space-y-3">
        <label className="block">
          <span className={label}>{x.classes.name}</span>
          <input className={field} value={namePt} onChange={(e) => setNamePt(e.target.value)} placeholder="Ex.: Cross Training" />
        </label>
        <label className="block">
          <span className={label}>{x.classes.nameEs}</span>
          <input className={field} value={nameEs} onChange={(e) => setNameEs(e.target.value)} placeholder="Ej.: Cross Training" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className={label}>{x.classes.weekday}</span>
            <select className={field} value={weekday} onChange={(e) => setWeekday(+e.target.value)}>
              {x.classes.weekdays.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={label}>{x.classes.time}</span>
            <input type="time" className={field} value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
          <label className="block">
            <span className={label}>{x.classes.duration}</span>
            <input type="number" min={15} max={180} className={field} value={duration} onChange={(e) => setDuration(+e.target.value)} />
          </label>
          <label className="block">
            <span className={label}>{x.classes.capacity}</span>
            <input type="number" min={1} max={200} className={field} value={capacity} onChange={(e) => setCapacity(+e.target.value)} />
          </label>
        </div>
        <label className="block">
          <span className={label}>{x.classes.room}</span>
          <input className={field} value={room} onChange={(e) => setRoom(e.target.value)} />
        </label>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-white scale-110' : 'border-transparent'} transition`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!namePt.trim()}
          className="w-full py-3 rounded-2xl bg-brand-primary text-white text-xs font-bold disabled:opacity-50"
        >
          {x.classes.create}
        </button>
      </div>
    </Sheet>
  );
};
