import React, { useEffect, useState } from 'react';
import { ClipboardCheck, Plus, TrendingDown, TrendingUp, Minus, CalendarClock } from 'lucide-react';
import { BodyAssessment } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import { useX } from '../../i18n/extraStrings';
import { extrasApi, localDay } from '../../services/extrasApi';
import { MOCK_TEACHERS } from '../../data/mockData';
import { DEMO_TEXT_ES } from '../../data/demoLocaleEs';
import { Sheet, useToast } from '../common/ui';

type MeasureKey = 'waistCm' | 'hipCm' | 'chestCm' | 'armCm' | 'thighCm';

/**
 * Avaliação física de um aluno.
 * `canAdd` libera o botão "Nova avaliação" (professor).
 */
export const AssessmentPanel: React.FC<{ studentId: string; canAdd?: boolean }> = ({ studentId, canAdd }) => {
  const { language, formatDate } = useLanguage();
  const x = useX();
  const [list, setList] = useState<BodyAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [toast, showToast] = useToast();

  const load = async () => {
    setLoading(true);
    setList(await extrasApi.getAssessments(studentId));
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const last = list[list.length - 1];
  const prev = list[list.length - 2];
  const teacherName = (id: string) => {
    const n = MOCK_TEACHERS.find((t) => t.id === id)?.name ?? '';
    return language === 'es-PY' ? DEMO_TEXT_ES[n] ?? n : n;
  };
  const nextDate = last ? (() => {
    const d = new Date(`${last.date}T12:00:00`);
    d.setDate(d.getDate() + 30);
    return localDay(d);
  })() : undefined;

  if (loading) return <div className="h-40 rounded-3xl bg-slate-900 animate-pulse" />;

  return (
    <div className="space-y-4">
      {canAdd && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-full py-3 rounded-2xl bg-brand-primary text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          {x.assessment.newAssessment}
        </button>
      )}

      {!last ? (
        <div className="text-center py-10 text-xs text-slate-500 bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl px-6">
          <ClipboardCheck className="w-6 h-6 mx-auto mb-2 opacity-60" />
          {x.assessment.empty}
        </div>
      ) : (
        <>
          {/* Resumo da última */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{x.assessment.last}</div>
                <div className="text-sm font-extrabold text-white">
                  {formatDate(last.date, { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
                <div className="text-[11px] text-slate-500">
                  {x.assessment.by} {teacherName(last.teacherId)}
                </div>
              </div>
              {nextDate && (
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1 justify-end">
                    <CalendarClock className="w-3 h-3" />
                    {x.assessment.next}
                  </div>
                  <div className="text-xs font-bold text-brand-primary">{formatDate(nextDate, { day: '2-digit', month: 'short' })}</div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Metric label={x.assessment.weight} value={last.weightKg} unit="kg" prev={prev?.weightKg} lowerIsBetter />
              <Metric label={x.assessment.bodyFat} value={last.bodyFatPct} unit="%" prev={prev?.bodyFatPct} lowerIsBetter />
              <Metric label={x.assessment.muscle} value={last.muscleMassKg} unit="kg" prev={prev?.muscleMassKg} />
            </div>
          </div>

          {/* Gráfico % gordura */}
          {list.length > 1 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">{x.assessment.fatEvolution}</h4>
              <FatChart data={list} format={(d) => formatDate(d, { day: '2-digit', month: 'short' })} />
            </div>
          )}

          {/* Medidas */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">{x.assessment.measures}</h4>
            <div className="divide-y divide-slate-800/80">
              {(
                [
                  ['chestCm', x.assessment.chest, false],
                  ['armCm', x.assessment.arm, false],
                  ['waistCm', x.assessment.waist, true],
                  ['hipCm', x.assessment.hip, true],
                  ['thighCm', x.assessment.thigh, false],
                ] as [MeasureKey, string, boolean][]
              ).map(([key, label, lower]) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <span className="text-xs text-slate-300">{label}</span>
                  <span className="flex items-center gap-3">
                    <Delta value={last[key]} prev={prev?.[key]} lowerIsBetter={lower} />
                    <span className="text-sm font-black text-white tabular-nums w-14 text-right">{last[key].toFixed(1)}</span>
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-slate-300">{x.assessment.restingHr}</span>
                <span className="flex items-center gap-3">
                  <Delta value={last.restingHr} prev={prev?.restingHr} lowerIsBetter />
                  <span className="text-sm font-black text-white tabular-nums w-14 text-right">
                    {last.restingHr} <span className="text-[10px] text-slate-500 font-semibold">{x.assessment.bpm}</span>
                  </span>
                </span>
              </div>
            </div>
            {last.notes && <p className="text-xs text-slate-400 mt-3 italic">“{last.notes}”</p>}
          </div>

          {/* Histórico */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">{x.assessment.history}</h4>
            <div className="space-y-1.5">
              {[...list].reverse().map((a) => (
                <div key={a.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                  <span className="text-xs font-semibold text-slate-200">{formatDate(a.date, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    {a.weightKg} kg · {a.bodyFatPct}% · {a.muscleMassKg} kg
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <NewAssessmentSheet
        open={adding}
        base={last}
        studentId={studentId}
        onClose={() => setAdding(false)}
        onSaved={async () => {
          setAdding(false);
          showToast(x.assessment.saved);
          await load();
        }}
      />
      {toast}
    </div>
  );
};

const Metric: React.FC<{ label: string; value: number; unit: string; prev?: number; lowerIsBetter?: boolean }> = ({
  label,
  value,
  unit,
  prev,
  lowerIsBetter,
}) => (
  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-center min-w-0">
    <div className="text-[10px] font-bold uppercase text-slate-500 truncate">{label}</div>
    <div className="text-lg font-black text-white tabular-nums leading-tight mt-0.5">
      {value.toFixed(1)}
      <span className="text-[10px] text-slate-500 font-semibold ml-0.5">{unit}</span>
    </div>
    <div className="flex justify-center mt-0.5">
      <Delta value={value} prev={prev} lowerIsBetter={lowerIsBetter} />
    </div>
  </div>
);

const Delta: React.FC<{ value: number; prev?: number; lowerIsBetter?: boolean }> = ({ value, prev, lowerIsBetter }) => {
  if (prev === undefined) return <span className="text-[10px] text-slate-600">—</span>;
  const diff = +(value - prev).toFixed(1);
  if (diff === 0)
    return (
      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-0.5">
        <Minus className="w-3 h-3" />0
      </span>
    );
  const good = lowerIsBetter ? diff < 0 : diff > 0;
  const Icon = diff < 0 ? TrendingDown : TrendingUp;
  return (
    <span className={`text-[10px] font-bold flex items-center gap-0.5 tabular-nums ${good ? 'text-emerald-400' : 'text-amber-400'}`}>
      <Icon className="w-3 h-3" />
      {diff > 0 ? '+' : ''}
      {diff}
    </span>
  );
};

const FatChart: React.FC<{ data: BodyAssessment[]; format: (d: string) => string }> = ({ data, format }) => {
  const W = 300;
  const H = 110;
  const pad = { l: 10, r: 10, t: 20, b: 22 };
  const vals = data.map((d) => d.bodyFatPct);
  const min = Math.min(...vals) - 1;
  const max = Math.max(...vals) + 1;
  const xOf = (i: number) => pad.l + (i / Math.max(data.length - 1, 1)) * (W - pad.l - pad.r);
  const yOf = (v: number) => pad.t + (1 - (v - min) / (max - min || 1)) * (H - pad.t - pad.b);
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${xOf(i).toFixed(1)},${yOf(d.bodyFatPct).toFixed(1)}`).join(' ');
  const area = `${path} L${xOf(data.length - 1)},${H - pad.b} L${xOf(0)},${H - pad.b} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="% gordura">
      <defs>
        <linearGradient id="gxFat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#gxFat)" />
      <path d={path} fill="none" stroke="var(--brand-primary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={d.id}>
          <circle cx={xOf(i)} cy={yOf(d.bodyFatPct)} r="3.5" fill="#0f172a" stroke="var(--brand-primary)" strokeWidth="2" />
          <text
            x={xOf(i)}
            y={yOf(d.bodyFatPct) - 8}
            textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
            fontSize="9"
            fontWeight="800"
            fill="#e2e8f0"
          >
            {d.bodyFatPct}%
          </text>
          <text x={xOf(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} fontSize="8.5" fill="#64748b">
            {format(d.date)}
          </text>
        </g>
      ))}
    </svg>
  );
};

const NewAssessmentSheet: React.FC<{
  open: boolean;
  base?: BodyAssessment;
  studentId: string;
  onClose: () => void;
  onSaved: () => void;
}> = ({ open, base, studentId, onClose, onSaved }) => {
  const x = useX();
  const blank = {
    weightKg: 75,
    bodyFatPct: 20,
    muscleMassKg: 32,
    waistCm: 85,
    hipCm: 98,
    chestCm: 100,
    armCm: 34,
    thighCm: 57,
    restingHr: 70,
  };
  const [form, setForm] = useState(blank);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setForm(base ? { ...blank, ...pick(base) } : blank);
      setNotes('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fields: [keyof typeof blank, string, string][] = [
    ['weightKg', x.assessment.weight, 'kg'],
    ['bodyFatPct', x.assessment.bodyFat, '%'],
    ['muscleMassKg', x.assessment.muscle, 'kg'],
    ['restingHr', x.assessment.restingHr, x.assessment.bpm],
    ['chestCm', x.assessment.chest, 'cm'],
    ['armCm', x.assessment.arm, 'cm'],
    ['waistCm', x.assessment.waist, 'cm'],
    ['hipCm', x.assessment.hip, 'cm'],
    ['thighCm', x.assessment.thigh, 'cm'],
  ];

  return (
    <Sheet open={open} onClose={onClose} title={<h3 className="text-base font-black text-white">{x.assessment.newAssessment}</h3>}>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {fields.map(([k, label, unit]) => (
            <label key={k} className="block">
              <span className="text-[10px] font-bold text-slate-400 block mb-1 truncate">
                {label} <span className="text-slate-600">({unit})</span>
              </span>
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={form[k]}
                onChange={(e) => setForm((f) => ({ ...f, [k]: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-sm font-bold text-white focus:outline-none focus:border-brand-primary tabular-nums"
              />
            </label>
          ))}
        </div>
        <label className="block">
          <span className="text-[10px] font-bold text-slate-400 block mb-1">{x.assessment.notes}</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
          />
        </label>
        <button
          type="button"
          onClick={async () => {
            await extrasApi.saveAssessment({
              ...form,
              studentId,
              teacherId: 'teacher-1',
              date: localDay(),
              notes: notes.trim() || undefined,
            });
            onSaved();
          }}
          className="w-full py-3 rounded-2xl bg-brand-primary text-white text-xs font-bold"
        >
          {x.assessment.saveAssessment}
        </button>
      </div>
    </Sheet>
  );
};

function pick(a: BodyAssessment) {
  const { weightKg, bodyFatPct, muscleMassKg, waistCm, hipCm, chestCm, armCm, thighCm, restingHr } = a;
  return { weightKg, bodyFatPct, muscleMassKg, waistCm, hipCm, chestCm, armCm, thighCm, restingHr };
}
