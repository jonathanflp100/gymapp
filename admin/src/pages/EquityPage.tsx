import { useMemo, useState } from 'react';
import { Plus, Trash2, TriangleAlert } from 'lucide-react';
import { useStore } from '../lib/store';
import { computeKpis } from '../lib/metrics';
import { fmtBrl, fmtBrlShort, fmtInt, fmtPct, lastMonths, toBrl, uid } from '../lib/format';
import { Field, PageHeader } from '../components/ui';
import { LineChart } from '../components/charts/Charts';
import { ChartCard } from '../components/charts/chartKit';
import { round, valuate, type Holder, type ValuationInput } from '../lib/valuation';

const SCEN_COLORS = ['#3987e5', '#d95926', '#199e70'];
const pct1 = (v: number) => `${v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

export default function EquityPage() {
  const { db } = useStore();
  const fx = db.settings.fxPygPerBrl;
  const k = useMemo(() => computeKpis(db), [db]);

  const current: ValuationInput = useMemo(() => {
    const from = `${lastMonths(12)[0]}-01`;
    const oneOff = db.transactions
      .filter((t) => t.type === 'entrada' && t.date >= from && t.category !== 'Mensalidade SaaS')
      .reduce((s, t) => s + toBrl(t.amount, t.currency, fx), 0);
    const saas = db.gyms.filter((g) => (g.status === 'ativa' || g.status === 'atrasada') && g.plan === 'saas');
    return {
      gymsBR: saas.filter((g) => g.country === 'BR').length,
      gymsPY: saas.filter((g) => g.country === 'PY').length,
      priceBR: 350,
      pricePY: 400000,
      fx,
      churnMonthly: k.churn3,
      growthYearly: Math.pow(1 + k.growth3, 12) - 1,
      margin: k.margin3,
      oneOffYear: oneOff,
    };
  }, [db, fx, k]);

  const [inp, setInp] = useState<ValuationInput>(current);
  const [preset, setPreset] = useState('hoje');
  const v = valuate({ ...inp, fx });
  const set = <K extends keyof ValuationInput>(key: K, val: ValuationInput[K]) => { setInp({ ...inp, [key]: val }); setPreset(''); };
  const applyPreset = (id: string, br: number, py: number) => {
    setPreset(id);
    if (id === 'hoje') setInp(current);
    // simulação em escala: margem e crescimento de uma empresa já madura
    else setInp({ ...inp, gymsBR: br, gymsPY: py, churnMonthly: Math.min(inp.churnMonthly, 0.02) || 0.02, growthYearly: 0.4, margin: 0.35, oneOffYear: 0 });
  };

  // curva: valor da empresa conforme o nº de academias (mesma proporção BR/PY da simulação)
  const total = inp.gymsBR + inp.gymsPY || 1;
  const shareBR = inp.gymsBR / total;
  const steps = [0, 250, 500, 750, 1000, 1250, 1500, 1750, 2000];
  const curve = steps.map((n) => valuate({ ...inp, fx, gymsBR: Math.round(n * shareBR), gymsPY: n - Math.round(n * shareBR), oneOffYear: 0 }));
  const curveSeries = v.scenarios.map((s, i) => ({ name: s.label, color: SCEN_COLORS[i], values: curve.map((c) => c.scenarios[i].value) }));
  const curveLabels = steps.map((n) => `${fmtInt(n)}`);

  return (
    <>
      <PageHeader title="Valuation e equity" subtitle="Quanto a empresa vale e quanto dar para um investidor. Estimativa pelo método de múltiplo da receita recorrente (ARR)." />

      <section className="card p-4 sm:p-5 mb-4">
        <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Cenário">
          {[
            ['hoje', 'Seus números de hoje', 0, 0],
            ['100', '100 academias (50 + 50)', 50, 50],
            ['1000', '1.000 academias (500 + 500)', 500, 500],
            ['5000', '5.000 academias (2.500 + 2.500)', 2500, 2500],
          ].map(([id, label, br, py]) => (
            <button key={id as string} role="tab" aria-selected={preset === id} onClick={() => applyPreset(id as string, br as number, py as number)} className={`px-3 py-1.5 rounded-lg text-sm ${preset === id ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}>
              {label as string}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="🇧🇷 Academias no Brasil"><input className="field num" type="number" min={0} value={inp.gymsBR} onChange={(e) => set('gymsBR', Math.max(0, Number(e.target.value)))} /></Field>
          <Field label="🇵🇾 Academias no Paraguai"><input className="field num" type="number" min={0} value={inp.gymsPY} onChange={(e) => set('gymsPY', Math.max(0, Number(e.target.value)))} /></Field>
          <Field label="Mensalidade Brasil (R$)"><input className="field num" type="number" min={0} value={inp.priceBR} onChange={(e) => set('priceBR', Number(e.target.value))} /></Field>
          <Field label="Mensalidade Paraguai (Gs.)"><input className="field num" type="number" min={0} step={1000} value={inp.pricePY} onChange={(e) => set('pricePY', Number(e.target.value))} /></Field>
          <Field label="Cancelamento por mês (%)"><input className="field num" type="number" min={0} step={0.1} value={+(inp.churnMonthly * 100).toFixed(2)} onChange={(e) => set('churnMonthly', Number(e.target.value) / 100)} /></Field>
          <Field label="Crescimento por ano (%)"><input className="field num" type="number" step={1} value={+(inp.growthYearly * 100).toFixed(1)} onChange={(e) => set('growthYearly', Number(e.target.value) / 100)} /></Field>
          <Field label="Margem de lucro (%)"><input className="field num" type="number" step={1} value={+(inp.margin * 100).toFixed(1)} onChange={(e) => set('margin', Number(e.target.value) / 100)} /></Field>
          <Field label="Receita não recorrente no ano (R$)"><input className="field num" type="number" min={0} value={Math.round(inp.oneOffYear)} onChange={(e) => set('oneOffYear', Number(e.target.value))} /></Field>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="card p-4">
          <div className="text-xs text-slate-400">Receita recorrente</div>
          <div className="text-2xl font-bold text-white num mt-1">{fmtBrlShort(v.mrr)}<span className="text-sm text-slate-500">/mês</span></div>
          <div className="text-xs text-slate-500 mt-1">ARR {fmtBrlShort(v.arr)} · 🇧🇷 {fmtBrlShort(v.mrrBR)} · 🇵🇾 {fmtBrlShort(v.mrrPY)}</div>
        </div>
        {v.scenarios.map((s, i) => (
          <div key={s.id} className={`card p-4 ${i === 1 ? 'ring-1 ring-slate-500' : ''}`}>
            <div className="text-xs text-slate-400 inline-flex items-center gap-1.5">
              <span className="inline-block w-3 rounded" style={{ height: 3, background: SCEN_COLORS[i] }} /> {s.label}{i === 1 ? ' (mais provável)' : ''}
            </div>
            <div className="text-2xl font-bold text-white num mt-1">{fmtBrlShort(s.value)}</div>
            <div className="text-xs text-slate-500 mt-1">{s.multiple.toFixed(1).replace('.', ',')}× a receita anual</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 mb-8">
        <ChartCard title="Quanto a empresa vale conforme cresce" subtitle={`Número de academias (${fmtPct(shareBR)} no Brasil), com os ajustes atuais`} series={curveSeries} labels={curveLabels} format={(x) => fmtBrl(x)}>
          <LineChart labels={curveLabels} series={curveSeries} format={(x) => fmtBrl(x)} axisFormat={fmtBrlShort} height={260} />
        </ChartCard>
        <section className="card p-4 sm:p-5 text-sm">
          <h3 className="font-semibold text-slate-100 mb-3">Como a conta é feita</h3>
          <ol className="space-y-2 text-slate-300 list-decimal pl-4">
            <li>Receita anual recorrente (ARR) = mensalidades × 12 = <strong className="num">{fmtBrl(v.arr)}</strong>.</li>
            <li>Múltiplo de mercado para SaaS pequeno: 2,5× (conservador), 4× (base) e 6× (otimista).</li>
            <li>
              Ajustes: crescimento ×{v.adjust.growth.toFixed(2).replace('.', ',')}, cancelamento ×{v.adjust.churn.toFixed(2).replace('.', ',')}, margem ×{v.adjust.margin.toFixed(2).replace('.', ',')} = <strong>×{v.adjust.total.toFixed(2).replace('.', ',')}</strong>.
            </li>
            <li>Receita que não se repete (licenças, implantação) entra por 1×.</li>
          </ol>
          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
            <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-2">
              <div className="text-slate-500">Regra dos 40</div>
              <div className="text-slate-100 font-semibold num">{v.ruleOf40.toFixed(0)}% {v.ruleOf40 >= 40 ? '✓' : ''}</div>
            </div>
            <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-2">
              <div className="text-slate-500">Cada academia vale</div>
              <div className="text-slate-100 font-semibold num">{fmtBrl(v.perGym)}</div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
            Estimativa para orientar conversas, não é laudo. Empresas privadas e sem investidor costumam sair 30–50% abaixo das de capital aberto; o preço final vem da negociação, da qualidade do contrato com as academias e de quanto o negócio depende de você.
          </p>
        </section>
      </div>

      <Round defaultPre={v.scenarios.map((s) => ({ label: s.label, value: s.value }))} />
    </>
  );
}

function Round({ defaultPre }: { defaultPre: { label: string; value: number }[] }) {
  const [preSrc, setPreSrc] = useState('1');
  const [manualPre, setManualPre] = useState(1_000_000);
  const [investment, setInvestment] = useState(250_000);
  const [pool, setPool] = useState(10);
  const [holders, setHolders] = useState<Holder[]>([{ id: uid(), name: 'Fundador', pct: 100 }]);
  const pre = preSrc === 'manual' ? manualPre : defaultPre[Number(preSrc)]?.value ?? 0;
  const r = round({ preMoney: pre, investment, poolPct: pool, holders });
  const segColors = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#0ca30c'];

  return (
    <section>
      <h2 className="text-lg font-semibold text-white mb-1">Rodada com investidor</h2>
      <p className="text-sm text-slate-400 mb-4">Simule quanto da empresa o investidor leva e quanto vale a parte de cada sócio depois do dinheiro entrar.</p>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-4">
        <div className="card p-4 sm:p-5 space-y-3">
          <Field label="Valor da empresa antes do dinheiro (pre-money)">
            <select className="field" value={preSrc} onChange={(e) => setPreSrc(e.target.value)}>
              {defaultPre.map((d, i) => <option key={d.label} value={String(i)}>{d.label}: {fmtBrlShort(d.value)}</option>)}
              <option value="manual">Digitar um valor</option>
            </select>
          </Field>
          {preSrc === 'manual' && (
            <Field label="Pre-money (R$)"><input className="field num" type="number" min={0} step={10000} value={manualPre} onChange={(e) => setManualPre(Number(e.target.value))} /></Field>
          )}
          <Field label="Quanto o investidor coloca (R$)"><input className="field num" type="number" min={0} step={10000} value={investment} onChange={(e) => setInvestment(Number(e.target.value))} /></Field>
          <Field label="Reserva para equipe futura (% depois da rodada)"><input className="field num" type="number" min={0} max={50} step={1} value={pool} onChange={(e) => setPool(Number(e.target.value))} /></Field>
          <div>
            <span className="label">Sócios hoje (% antes da rodada)</span>
            <div className="space-y-2">
              {holders.map((h, i) => (
                <div key={h.id} className="flex gap-2">
                  <input className="field" value={h.name} onChange={(e) => setHolders(holders.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} aria-label="Nome do sócio" />
                  <input className="field num !w-24" type="number" min={0} max={100} value={h.pct} onChange={(e) => setHolders(holders.map((x, j) => (j === i ? { ...x, pct: Number(e.target.value) } : x)))} aria-label="Participação" />
                  {holders.length > 1 && <button className="p-2 text-slate-400 hover:text-rose-300" onClick={() => setHolders(holders.filter((_, j) => j !== i))} aria-label="Remover sócio"><Trash2 size={16} /></button>}
                </div>
              ))}
              <button className="btn btn-ghost !py-1 text-xs" onClick={() => setHolders([...holders, { id: uid(), name: 'Novo sócio', pct: 0 }])}><Plus size={14} /> Sócio</button>
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div><div className="text-xs text-slate-400">Valor depois do dinheiro (post-money)</div><div className="text-xl font-bold text-white num">{fmtBrlShort(r.postMoney)}</div></div>
            <div><div className="text-xs text-slate-400">Investidor fica com</div><div className="text-xl font-bold text-white num">{pct1(r.investorPct)}</div></div>
            <div><div className="text-xs text-slate-400">Diluição dos sócios atuais</div><div className="text-xl font-bold text-white num">{pct1(r.dilution)}</div></div>
          </div>

          {/* barra de participação: segmentos com 2px de respiro */}
          <div className="flex h-5 w-full gap-[2px] rounded-md overflow-hidden mb-2" role="img" aria-label="Divisão das ações depois da rodada">
            {r.rows.filter((x) => x.after > 0).map((x, i) => (
              <div key={x.name + i} title={`${x.name}: ${pct1(x.after)}`} style={{ width: `${x.after}%`, background: segColors[i % segColors.length] }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mb-4">
            {r.rows.filter((x) => x.after > 0).map((x, i) => (
              <span key={x.name + i} className="inline-flex items-center gap-1.5"><span className="inline-block w-3 rounded" style={{ height: 3, background: segColors[i % segColors.length] }} />{x.name}</span>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-800">
                  <th className="py-2 pr-3 font-medium">Quem</th>
                  <th className="py-2 pr-3 font-medium text-right">Antes</th>
                  <th className="py-2 pr-3 font-medium text-right">Depois</th>
                  <th className="py-2 font-medium text-right">Vale (post-money)</th>
                </tr>
              </thead>
              <tbody>
                {r.rows.map((x, i) => (
                  <tr key={x.name + i} className="border-b border-slate-800/60">
                    <td className="py-2 pr-3 text-slate-200">{x.name}</td>
                    <td className="py-2 pr-3 text-right num text-slate-400">{x.kind === 'socio' ? pct1(x.before) : '—'}</td>
                    <td className="py-2 pr-3 text-right num text-slate-100">{pct1(x.after)}</td>
                    <td className="py-2 text-right num text-slate-100">{fmtBrl(x.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {r.warning && <p className="mt-3 text-sm text-amber-300 inline-flex items-start gap-1.5"><TriangleAlert size={16} className="shrink-0 mt-0.5" /> {r.warning}</p>}
          <p className="text-[11px] text-slate-500 mt-4">Conta simplificada (sem conversíveis, preferências de liquidação ou vesting). Antes de assinar, leve a proposta para um advogado societário.</p>
        </div>
      </div>
    </section>
  );
}
