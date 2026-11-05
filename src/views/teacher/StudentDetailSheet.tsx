import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Flame, CalendarCheck, Dumbbell, ClipboardList, Plus, X, AlertTriangle, Trophy } from 'lucide-react';
import { Routine, Student, WorkoutHistoryEntry } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useX } from '../../i18n/extraStrings';
import { AssessmentPanel } from '../../components/assessment/AssessmentPanel';
import { Sheet, Stat, initials, useToast } from '../../components/common/ui';

type Tab = 'overview' | 'routines' | 'assessment' | 'workouts';

/** Ficha completa do aluno para o professor. */
export const StudentDetailSheet: React.FC<{
  student: Student | null;
  onClose: () => void;
  onChanged?: () => void;
}> = ({ student, onClose, onChanged }) => {
  const { quickLoginAsStudent } = useAuth();
  const { formatDate, formatWeight } = useLanguage();
  const x = useX();
  const [tab, setTab] = useState<Tab>('overview');
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [picking, setPicking] = useState(false);
  const [toast, showToast] = useToast();

  const load = async (s: Student) => {
    const [h, r] = await Promise.all([api.getWorkoutHistory(s.id), api.getRoutines()]);
    setHistory(h);
    setRoutines(r);
  };

  useEffect(() => {
    if (!student) return;
    setTab('overview');
    void load(student);
  }, [student]);

  const assigned = useMemo(
    () => (student ? routines.filter((r) => r.assignedStudentIds.includes(student.id)) : []),
    [routines, student]
  );
  const available = useMemo(
    () => (student ? routines.filter((r) => !r.assignedStudentIds.includes(student.id)) : []),
    [routines, student]
  );

  const stats = useMemo(() => {
    const since = Date.now() - 30 * 86400000;
    const last30 = history.filter((h) => Date.parse(h.startedAt) >= since);
    const vol = last30.reduce((a, h) => a + h.totalVolumeKg, 0);
    const prs = history.reduce((a, h) => a + (h.personalRecordsBroken?.length ?? 0), 0);
    const lastDate = history[0]?.startedAt;
    const idleDays = lastDate ? Math.floor((Date.now() - Date.parse(lastDate)) / 86400000) : null;
    return { last30: last30.length, perWeek: +(last30.length / 4.3).toFixed(1), vol, prs, lastDate, idleDays };
  }, [history]);

  if (!student) return null;

  const tabs: [Tab, string][] = [
    ['overview', x.student.overview],
    ['routines', x.student.routines],
    ['assessment', x.assessment.tab],
    ['workouts', x.student.workouts],
  ];

  return (
    <Sheet
      open={!!student}
      onClose={onClose}
      tall
      title={
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-brand-primary flex items-center justify-center font-black text-sm text-white shrink-0">
            {initials(student.name)}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-black text-white truncate">{student.name}</h3>
            <div className="text-[11px] text-slate-400 truncate">
              {student.plan} · <span className={student.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}>{x.student.status[student.status] ?? student.status}</span>
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 sticky top-0 z-10">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`py-2 rounded-xl text-[11px] font-bold transition truncate ${
                tab === id ? 'bg-brand-primary text-white' : 'text-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-3">
            {stats.idleDays !== null && stats.idleDays >= 5 && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {x.student.inactiveDays(stats.idleDays)}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Stat label={x.student.streak} value={<span className="flex items-center gap-1"><Flame className="w-4 h-4 text-amber-400" />{student.currentStreakDays} {x.student.days}</span>} />
              <Stat
                label={x.student.lastWorkout}
                value={stats.lastDate ? formatDate(stats.lastDate, { day: '2-digit', month: 'short' }) : x.student.never}
              />
              <Stat label={x.student.last30} value={stats.last30} hint={`${stats.perWeek}${x.student.perWeek}`} accent />
              <Stat label="PRs" value={<span className="flex items-center gap-1"><Trophy className="w-4 h-4 text-amber-400" />{stats.prs}</span>} />
              <Stat label={x.assessment.weight} value={formatWeight(student.currentWeightKg)} hint={`${x.student.goal}: ${formatWeight(student.targetWeightKg)}`} />
              <Stat label={x.student.height} value={student.heightCm ? `${student.heightCm} cm` : '—'} hint={`${x.student.since}: ${formatDate(student.joinDate, { month: 'short', year: 'numeric' })}`} />
            </div>

            <FrequencyStrip history={history} />

            <button
              type="button"
              onClick={() => {
                quickLoginAsStudent(student.id);
                onClose();
              }}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4 text-brand-primary" />
              {x.student.viewAs}
            </button>
          </div>
        )}

        {tab === 'routines' && (
          <div className="space-y-3">
            {assigned.length === 0 && <p className="text-xs text-slate-500">{x.student.noRoutines}</p>}
            {assigned.map((r) => (
              <div key={r.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary-subtle text-brand-primary flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-extrabold text-white truncate">{r.name}</div>
                  <div className="text-[11px] text-slate-400">{r.exercises.length} · {r.category}</div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await api.saveRoutine({ ...r, assignedStudentIds: r.assignedStudentIds.filter((id) => id !== student.id) });
                    await load(student);
                    onChanged?.();
                  }}
                  className="text-[11px] font-bold text-slate-400 hover:text-red-400 px-2 py-1"
                >
                  {x.student.unassign}
                </button>
              </div>
            ))}

            {!picking ? (
              <button
                type="button"
                onClick={() => setPicking(true)}
                disabled={available.length === 0}
                className="w-full py-3 rounded-2xl bg-brand-primary text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
                {x.student.assign}
              </button>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2 space-y-1">
                <div className="flex justify-end">
                  <button type="button" onClick={() => setPicking(false)} className="p-1 text-slate-400" aria-label="Fechar">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {available.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={async () => {
                      await api.assignRoutine(r.id, [student.id]);
                      setPicking(false);
                      showToast(x.student.assignedToast);
                      await load(student);
                      onChanged?.();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-800 text-xs font-semibold text-slate-200"
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'assessment' && <AssessmentPanel studentId={student.id} canAdd />}

        {tab === 'workouts' && (
          <div className="space-y-2">
            {history.length === 0 && <p className="text-xs text-slate-500">{x.student.noWorkouts}</p>}
            {history.slice(0, 15).map((h) => (
              <div key={h.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-extrabold text-white truncate">{h.routineName}</div>
                  <div className="text-[11px] text-slate-400 shrink-0">{formatDate(h.startedAt, { day: '2-digit', month: 'short' })}</div>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1"><CalendarCheck className="w-3 h-3" />{h.durationMinutes} min</span>
                  <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" />{Math.round(h.totalVolumeKg).toLocaleString()} kg</span>
                  <span>{h.totalSets} sets</span>
                  {!!h.personalRecordsBroken?.length && (
                    <span className="text-amber-400 font-bold flex items-center gap-1"><Trophy className="w-3 h-3" />{h.personalRecordsBroken.length}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {toast}
    </Sheet>
  );
};

/** Últimas 8 semanas: quantos treinos por semana. */
const FrequencyStrip: React.FC<{ history: WorkoutHistoryEntry[] }> = ({ history }) => {
  const x = useX();
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = Date.now() - i * 7 * 86400000;
    const start = end - 7 * 86400000;
    return history.filter((h) => {
      const t = Date.parse(h.startedAt);
      return t > start && t <= end;
    }).length;
  }).reverse();
  const max = Math.max(4, ...weeks);
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3">
      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wide mb-2">{x.student.frequency}</div>
      <div className="flex items-end gap-1.5 h-16">
        {weeks.map((n, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] font-bold text-slate-400 tabular-nums">{n}</span>
            <div
              className="w-full rounded-md"
              style={{
                height: `${Math.max(4, (n / max) * 44)}px`,
                backgroundColor: i === weeks.length - 1 ? 'var(--brand-primary)' : 'rgba(var(--brand-primary-rgb), 0.35)',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
