import React, { useState, useEffect } from 'react';
import { History, ChevronDown, ChevronUp, Award, Calendar, Pencil, NotebookPen } from 'lucide-react';
import { useX } from '../../i18n/extraStrings';
import { WorkoutEditorSheet } from '../../components/workout/WorkoutEditorSheet';
import { useToast } from '../../components/common/ui';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/api';
import { WorkoutHistoryEntry, Student } from '../../types';

export const HistoryView: React.FC<{ embedded?: boolean }> = ({ embedded }) => {
  const { currentUser } = useAuth();
  const { t, formatDate, formatWeight } = useLanguage();

  const student = currentUser as Student;

  const [historyList, setHistoryList] = useState<WorkoutHistoryEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const x = useX();
  const [limit, setLimit] = useState(20);
  const [editing, setEditing] = useState<WorkoutHistoryEntry | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [toast, showToast] = useToast();

  useEffect(() => {
    async function loadHistory() {
      if (!student) return;
      try {
        const history = await api.getWorkoutHistory(student.id);
        setHistoryList(history);
        if (history.length > 0 && reloadKey === 0) {
          setExpandedId(history[0].id); // Expand first by default
        }
      } catch (err) {
        console.error('Error loading history:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id, reloadKey]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className={`space-y-5 animate-fadeIn ${embedded ? '' : 'pb-28'}`}>
      {/* Title */}
      {!embedded && (
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">
            {t('history.title')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('history.subtitle')}
          </p>
        </div>
      )}

      {student && (
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm font-bold text-slate-200"
        >
          <NotebookPen className="w-4 h-4 text-brand-primary" />
          {x.pro.logManual}
        </button>
      )}
      {student && (
        <WorkoutEditorSheet
          open={editorOpen}
          entry={editing}
          student={student}
          onClose={() => setEditorOpen(false)}
          onSaved={(m) => {
            showToast(m);
            setReloadKey((k) => k + 1);
          }}
        />
      )}
      {toast}

      {historyList.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-xl">
          <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">{t('history.emptyHistory')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {historyList.slice(0, limit).map((entry) => {
            const isExpanded = expandedId === entry.id;

            return (
              <div
                key={entry.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden transition-all"
              >
                {/* Header Summary Card */}
                <div
                  onClick={() => toggleExpand(entry.id)}
                  className="p-4 cursor-pointer hover:bg-slate-800/40 transition flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(entry.startedAt, {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>

                      {entry.manual && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">{x.pro.manualTag}</span>
                      )}
                      {entry.personalRecordsBroken && entry.personalRecordsBroken.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          <span>PR</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-white">
                      {entry.routineName}
                    </h3>

                    {/* Compact Metrics */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                      <span>{entry.durationMinutes} min</span>
                      <span>·</span>
                      <span>{formatWeight(entry.totalVolumeKg)}</span>
                      <span>·</span>
                      <span>{entry.totalSets} {t('common.sets')}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
                    className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expandable Exercise Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 bg-slate-950/50 space-y-3 animate-fadeIn">
                    {entry.exercises.map((ex, exIdx) => (
                      <div
                        key={exIdx}
                        className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800/80 text-xs"
                      >
                        <div className="flex items-center justify-between font-bold text-white mb-2">
                          <span>{ex.exerciseName}</span>
                          <span className="text-slate-500 font-normal">
                            {ex.sets.filter((s) => s.completed).length} {t('common.sets')}
                          </span>
                        </div>

                        {/* Sets Mini-List */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {ex.sets.map((set, sIdx) => (
                            <div
                              key={sIdx}
                              className={`p-2 rounded-xl border flex items-center justify-between ${
                                set.completed
                                  ? 'bg-slate-950 border-slate-800 text-slate-200'
                                  : 'bg-slate-950/40 border-slate-900 text-slate-600'
                              }`}
                            >
                              <span className="text-[10px] text-slate-500 font-bold">
                                {set.type === 'warmup' ? x.pro.warmupSet : set.type === 'drop' ? x.pro.dropSet : `#${set.setNumber}`}
                              </span>
                              <span className="font-extrabold text-xs">
                                {set.durationSec && !set.weightKg
                                  ? set.durationSec >= 120
                                    ? `${Math.round(set.durationSec / 60)} min`
                                    : `${set.durationSec}s`
                                  : `${set.weightKg} kg × ${set.reps}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {student && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(entry);
                          setEditorOpen(true);
                        }}
                        className="text-xs font-bold text-brand-primary flex items-center gap-1.5"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        {x.pro.editWorkout}
                      </button>
                    )}

                    {entry.notes && (
                      <p className="text-xs text-slate-400 italic bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        "{entry.notes}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {historyList.length > limit && (
            <button
              type="button"
              onClick={() => setLimit((l) => l + 20)}
              className="w-full py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm font-bold text-slate-300"
            >
              {x.engage.seeAll} ({historyList.length - limit})
            </button>
          )}
        </div>
      )}
    </div>
  );
};
