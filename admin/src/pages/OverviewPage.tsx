import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../lib/store';
import { businessHealth, computeKpis, monthlySeries, type Scope } from '../lib/metrics';
import { fmtBrl, fmtBrlShort, fmtDate, fmtInt, fmtPct, monthLabel, today } from '../lib/format';
import { InsightCard, Kpi, PageHeader, ScopeTabs, flag } from '../components/ui';
import { BarChart, LineChart } from '../components/charts/Charts';
import { C, ChartCard } from '../components/charts/chartKit';
import { STAGES } from '../lib/types';

export default function OverviewPage() {
  const { db } = useStore();
  const [scope, setScope] = useState<Scope>('ALL');
  const k = useMemo(() => computeKpis(db, scope), [db, scope]);
  const h = useMemo(() => businessHealth(db, scope), [db, scope]);
  const s = useMemo(() => monthlySeries(db, 12, scope), [db, scope]);
  const labels = s.map((r) => monthLabel(r.month));

  const mrrSeries =
    scope === 'ALL'
      ? [
          { name: 'Brasil', color: C.br, values: s.map((r) => r.mrrBR) },
          { name: 'Paraguai', color: C.py, values: s.map((r) => r.mrrPY) },
        ]
      : [{ name: scope === 'BR' ? 'Brasil' : 'Paraguai', color: scope === 'BR' ? C.br : C.py, values: s.map((r) => r.mrr) }];
  const gymSeries =
    scope === 'ALL'
      ? [
          { name: 'Brasil', color: C.br, values: s.map((r) => r.gymsBR) },
          { name: 'Paraguai', color: C.py, values: s.map((r) => r.gymsPY) },
        ]
      : [{ name: scope === 'BR' ? 'Brasil' : 'Paraguai', color: scope === 'BR' ? C.br : C.py, values: s.map((r) => (scope === 'BR' ? r.gymsBR : r.gymsPY)) }];
  const cashSeries = [
    { name: 'Entradas', color: C.income, values: s.map((r) => r.income) },
    { name: 'Saídas', color: C.expense, values: s.map((r) => r.expense) },
  ];

  const followUps = db.leads
    .filter((l) => (scope === 'ALL' || l.country === scope) && l.nextActionDate && l.nextActionDate <= today() && l.stage !== 'ganho' && l.stage !== 'perdido')
    .sort((a, b) => (a.nextActionDate! < b.nextActionDate! ? -1 : 1))
    .slice(0, 6);
  const newest = db.gyms
    .filter((g) => scope === 'ALL' || g.country === scope)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, 6);

  const scoreColor = h.score >= 75 ? 'text-emerald-300' : h.score >= 55 ? 'text-amber-300' : 'text-rose-300';

  return (
    <>
      <PageHeader title="Visão geral" subtitle="Tudo o que está acontecendo no Brasil e no Paraguai, em reais.">
        <ScopeTabs value={scope} onChange={setScope} />
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-4">
        <Kpi label="Academias ativas" value={fmtInt(k.gymsLive)} hint={scope === 'ALL' ? `🇧🇷 ${k.gymsBR} · 🇵🇾 ${k.gymsPY} · ${k.gymsTrial} em teste` : `${k.gymsTrial} em teste`} />
        <Kpi label="Receita recorrente (MRR)" value={fmtBrl(k.mrr)} hint={`${k.growth3 >= 0 ? '+' : ''}${fmtPct(k.growth3)} ao mês`} tone={k.growth3 > 0 ? 'good' : 'bad'} />
        <Kpi label="Receita anual (ARR)" value={fmtBrlShort(k.arr)} hint="MRR × 12" />
        <Kpi label="Lucro médio (3 meses)" value={fmtBrl(k.profit3)} hint={`margem ${fmtPct(k.margin3)}`} tone={k.profit3 >= 0 ? 'good' : 'bad'} />
        <Kpi label="Alunos usando o app" value={fmtInt(k.activeStudents)} hint={`de ${fmtInt(k.students)} cadastrados`} />
        <a href="#/assistente" className="card p-4 hover:border-slate-600 block">
          <div className="text-xs text-slate-400">Saúde do negócio</div>
          <div className={`text-2xl font-bold num mt-1 ${scoreColor}`}>{h.score}<span className="text-sm text-slate-500">/100</span></div>
          <div className="text-xs text-slate-400 mt-1 inline-flex items-center gap-1">Ver assistente <ArrowRight size={12} /></div>
        </a>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Receita recorrente por mês (MRR)" subtitle="Mensalidades das academias ativas, em reais" series={mrrSeries} labels={labels} format={(v) => fmtBrl(v)}>
          <LineChart labels={labels} series={mrrSeries} format={(v) => fmtBrl(v)} axisFormat={fmtBrlShort} />
        </ChartCard>
        <ChartCard title="Entradas × saídas" subtitle="Tudo o que entrou e saiu no mês, em reais" series={cashSeries} labels={labels} format={(v) => fmtBrl(v)}>
          <BarChart labels={labels} series={cashSeries} format={(v) => fmtBrl(v)} axisFormat={fmtBrlShort} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ChartCard title="Academias ativas" subtitle="No fim de cada mês" series={gymSeries} labels={labels} format={(v) => fmtInt(v)}>
          <LineChart labels={labels} series={gymSeries} format={(v) => fmtInt(v)} height={200} />
        </ChartCard>

        <section className="card p-4 sm:p-5">
          <h3 className="font-semibold text-slate-100 mb-3">Para hoje</h3>
          {followUps.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhum retorno vencido no CRM. 👌</p>
          ) : (
            <ul className="space-y-2">
              {followUps.map((l) => (
                <li key={l.id}>
                  <a href="#/crm" className="flex items-start justify-between gap-2 rounded-lg p-2 hover:bg-slate-800/60">
                    <div className="min-w-0">
                      <div className="text-sm text-slate-100 truncate">{flag(l.country)} {l.gymName}</div>
                      <div className="text-xs text-slate-400 truncate">{l.nextAction} · {STAGES.find((s) => s.id === l.stage)?.label}</div>
                    </div>
                    <span className={`text-xs num shrink-0 ${l.nextActionDate! < today() ? 'text-rose-300' : 'text-amber-300'}`}>{fmtDate(l.nextActionDate)}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-4 sm:p-5">
          <h3 className="font-semibold text-slate-100 mb-3">Academias mais recentes</h3>
          <ul className="space-y-2">
            {newest.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-slate-200">{flag(g.country)} {g.name} <span className="text-slate-500">· {g.city}</span></span>
                <span className="text-xs text-slate-400 num shrink-0">{fmtDate(g.startedAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <h2 className="text-lg font-semibold text-white mt-8 mb-3">O que o assistente viu</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {h.insights.slice(0, 6).map((i) => (
          <InsightCard key={i.title} {...i} />
        ))}
      </div>
    </>
  );
}
