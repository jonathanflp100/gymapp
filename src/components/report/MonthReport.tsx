import React, { useEffect, useState } from 'react';
import { FileBarChart, ChevronRight, Printer, Award, AlertTriangle, CalendarDays, Target } from 'lucide-react';
import type { MonthReport as Report } from '../../types';
import { reportApi } from '../../services/reportApi';
import { printHtml, esc } from '../../services/print';
import { useBrand } from '../../context/BrandContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useBi, useX } from '../../i18n/extraStrings';
import { Sheet } from '../common/ui';

const lastMonths = (n: number) => {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < n; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
};

/** Cartão no painel + relatório do mês em tela e para imprimir/salvar PDF. */
export const MonthReportCard: React.FC = () => {
  const x = useX();
  const bi = useBi();
  const { language } = useLanguage();
  const { brand } = useBrand();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(lastMonths(1)[0]);
  const [r, setR] = useState<Report | null>(null);

  useEffect(() => {
    if (!open) return;
    setR(null);
    reportApi.get(month).then(setR).catch(() => setR(null));
  }, [open, month]);

  const monthLabel = (m: string) => {
    const t = new Date(`${m}-15T12:00:00`).toLocaleDateString(language, { month: 'long', year: 'numeric' });
    return t.charAt(0).toUpperCase() + t.slice(1);
  };
  const weekday = (n: number | null) =>
    n === null
      ? '—'
      : ((d) => d.charAt(0).toUpperCase() + d.slice(1))(new Date(2026, 1, 1 + n).toLocaleDateString(language, { weekday: 'long' })); // 1/fev/2026 é domingo
  const text = (v: unknown) => (typeof v === 'string' ? v : bi(v as never));
  const avg = r && r.trainedMonth ? (r.totalWorkouts / r.trainedMonth).toFixed(1).replace('.', language === 'es-PY' || language === 'pt-BR' ? ',' : '.') : '0';

  const kpis = r
    ? [
        [x.pro.activeStudents, r.activeStudents],
        [x.pro.trainedMonth, r.trainedMonth],
        [x.pro.totalWorkouts, r.totalWorkouts],
        [x.pro.avgPerStudent, avg],
        [x.pro.checkinsMonth, r.checkins],
        [x.pro.newStudents, r.newStudents],
        [x.pro.busiestDay, weekday(r.busiestWeekday)],
      ]
    : [];

  const print = () => {
    if (!r) return;
    const li = (rows: string[]) => (rows.length ? `<table><tbody>${rows.join('')}</tbody></table>` : `<p>${esc(x.pro.none)}</p>`);
    const body = `<h1>${esc(x.pro.report)}</h1>
<div class="meta">${esc(monthLabel(r.month))}</div>
<div class="kpis">${kpis.map(([k, v]) => `<div class="kpi"><b>${esc(v)}</b><span>${esc(k)}</span></div>`).join('')}</div>
<div class="two">
  <div><h2>${esc(x.pro.topStudents)}</h2>${li(r.topStudents.map((s) => `<tr><td>${esc(s.name)}</td><td class="c">${esc(x.pro.days(s.days))}</td></tr>`))}</div>
  <div><h2>${esc(x.pro.atRisk)}</h2>${li(r.atRisk.map((s) => `<tr><td>${esc(s.name)}</td><td class="c">${s.days === null ? '—' : esc(x.pro.days(s.days))}</td></tr>`))}</div>
</div>
<div class="two">
  <div><h2>${esc(x.pro.classes)}</h2>${li(r.classes.map((c) => `<tr><td>${esc(text(c.name))}</td><td class="c">${esc(x.pro.bookings(c.bookings))}</td></tr>`))}</div>
  <div><h2>${esc(x.pro.challengesDone)}</h2>${li(r.challenges.map((c) => `<tr><td>${esc(text(c.title))}</td><td class="c">${c.done}</td></tr>`))}</div>
</div>
<footer>${esc(x.pro.printedAt(new Date().toLocaleDateString(language)))}</footer>`;
    printHtml(body, `${x.pro.report} ${r.month}`, brand);
  };

  const List: React.FC<{ icon: React.ReactNode; title: string; rows: [string, string][] }> = ({ icon, title, rows }) => (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3">
      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
        {icon}
        {title}
      </h4>
      {!rows.length && <p className="text-xs text-slate-500">{x.pro.none}</p>}
      {rows.map(([a, b], i) => (
        <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-0">
          <span className="text-slate-200 truncate">{a}</span>
          <span className="text-slate-400 tabular-nums shrink-0 ml-2">{b}</span>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-center gap-3"
      >
        <span className="w-11 h-11 rounded-2xl bg-brand-primary-subtle text-brand-primary flex items-center justify-center shrink-0">
          <FileBarChart className="w-5 h-5" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-black text-white">{x.pro.report}</span>
          <span className="block text-[11px] text-slate-400">{x.pro.reportHint}</span>
        </span>
        <ChevronRight className="w-4 h-4 text-slate-500" />
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} tall title={<h3 className="text-base font-black text-white">{x.pro.report}</h3>}>
        <div className="space-y-3" data-testid="month-report">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            aria-label={x.pro.report}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white"
          >
            {lastMonths(6).map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
          {!r ? (
            <div className="h-40 rounded-2xl bg-slate-950 animate-pulse" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {kpis.map(([k, v]) => (
                  <div key={String(k)} className="bg-slate-950 border border-slate-800 rounded-2xl p-3">
                    <div className="text-lg font-black text-white tabular-nums">{v}</div>
                    <div className="text-[10px] text-slate-400">{k}</div>
                  </div>
                ))}
              </div>
              <List icon={<Award className="w-3.5 h-3.5 text-amber-400" />} title={x.pro.topStudents} rows={r.topStudents.map((s) => [s.name, x.pro.days(s.days)])} />
              <List
                icon={<AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                title={x.pro.atRisk}
                rows={r.atRisk.map((s) => [s.name, s.days === null ? '—' : x.pro.days(s.days)])}
              />
              <List icon={<CalendarDays className="w-3.5 h-3.5 text-sky-400" />} title={x.pro.classes} rows={r.classes.map((c) => [text(c.name), x.pro.bookings(c.bookings)])} />
              <List icon={<Target className="w-3.5 h-3.5 text-brand-primary" />} title={x.pro.challengesDone} rows={r.challenges.map((c) => [text(c.title), String(c.done)])} />
              <button
                type="button"
                onClick={print}
                className="w-full py-3 rounded-2xl bg-brand-primary text-white text-sm font-black flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                {x.pro.print}
              </button>
            </>
          )}
        </div>
      </Sheet>
    </>
  );
};
