import React, { useState, useEffect } from 'react';
import { Search, Flame, Calendar, Dumbbell, UserCheck, X, Eye, Phone } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/api';
import { Student, Routine } from '../../types';
import { StudentDetailSheet } from './StudentDetailSheet';

export const StudentsView: React.FC = () => {
  const { t, formatDate, formatWeight } = useLanguage();

  const [students, setStudents] = useState<Student[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    async function loadData() {
      const [allStudents, allRoutines] = await Promise.all([
        api.getStudents(),
        api.getRoutines(),
      ]);
      setStudents(allStudents);
      setRoutines(allRoutines);
    }
    loadData();
  }, []);

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5 pb-28 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">
          {t('teacher.studentsTitle')}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {t('teacher.studentsSubtitle')} ({students.length})
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('teacher.searchStudents')}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary transition"
        />
      </div>

      {/* Students List */}
      <div className="space-y-3">
        {filteredStudents.map((student) => {
          const studentRoutine = routines.find((r) => r.id === student.activeRoutineId);

          return (
            <div
              key={student.id}
              onClick={() => setSelectedStudent(student)}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl hover:border-slate-700 transition cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center font-black text-sm text-white shrink-0">
                  {student.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-white truncate">
                      {student.name}
                    </h3>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        student.status === 'active' ? 'bg-emerald-400' : 'bg-slate-600'
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {student.lastWorkoutDate
                        ? formatDate(student.lastWorkoutDate, { day: '2-digit', month: 'short' })
                        : t('teacher.neverTrained')}
                    </span>
                    <span>·</span>
                    <span>{student.plan}</span>
                  </div>

                  {studentRoutine && (
                    <div className="text-[11px] text-brand-primary font-semibold mt-1 truncate">
                      {studentRoutine.name}
                    </div>
                  )}
                </div>
              </div>

              {/* Streak badge */}
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-400 text-xs font-bold shrink-0">
                <Flame className="w-3.5 h-3.5 fill-amber-500" />
                <span>{student.currentStreakDays}d</span>
              </div>
            </div>
          );
        })}
      </div>

      <StudentDetailSheet
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onChanged={async () => setRoutines(await api.getRoutines())}
      />
    </div>
  );
};
