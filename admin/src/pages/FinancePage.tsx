import { useMemo, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Download, Plus, Search, Trash2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { byCategory, monthlySeries, type Scope } from '../lib/metrics';
import { fmtBrl, fmtBrlShort, fmtDate, fmtMoney, fmtPct, lastMonths, monthLabel, toBrl, today, uid } from '../lib/format';
import { Empty, Field, Kpi, Modal, PageHeader, ScopeTabs, flag } from '../components/ui';
import { BarChart, HBars } from '../components/charts/Charts';
import { C, ChartCard } from '../components/charts/chartKit';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type Transaction } from '../lib/types';

type Period = 'mes' | 'anterior' | '3m' | '12m' | 'ano';
const PERIODS: { id: Period; label: string }[] = [
  { id: 'mes', label: 'Este mês' },
  { id: 'anterior', label: 'Mês passado' },
  { id: '3m', label: 'Últimos 3 meses' },
  { id: '12m', label: 'Últimos 12 meses' },
  { id: 'ano', label: 'Este ano' },
];

function range(p: Period): [string, string] {
  const months = lastMonths(12);
  const cur = months[11];
  const end = `${cur}-31`;
  switch (p) {
    case 'mes': return [`${cur}-01`, end];
    case 'anterior': return [`${months[10]}-01`, `${months[10]}-31`];
    case '3m': return [`${months[9]}-01`, end];
    case '12m': return [`${months[0]}-01`, end];
    case 'ano': return [`${cur.slice(0, 4)}-01-01`, end];
  }
}

export default function FinancePage() {
  const { db, upsert, remove } = useStore();
  const fx = db.settings.fxPygPerBrl;
  const [scope, setScope] = useState<Scope>('ALL');
  const [period, setPeriod] = useState<Period>('3m');
  const [type, setType] = useState<'todos' | Transaction['type']>('todos');
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<Transaction | null>(null);
  const [limit, setLimit] = useState(50);

  const [from, to] = range(period);
  const inPeriod = useMemo(
    () => db.transactions.filter((t) => t.date >= from && t.date <= to && (scope === 'ALL' || t.country === scope)),
    [db.transactions, from, to, scope],
  );
  const income = inPeriod.filter((t) => t.type === 'entrada').reduce((s, t) => s + toBrl(t.amount, t.currency, fx), 0);
  const expense = inPeriod.filter((t) => t.type === 'saida').reduce((s, t) => s + toBrl(t.amount, t.currency, fx), 0);
  const cats = byCategory(inPeriod, fx);
  const series = monthlySeries(db, 12, scope);
  const labels = series.map((r) => monthLabel(r.month));
  const profit = [{ name: 'Lucro', color: C.profit, values: series.map((r) => r.profit) }];

  const rows = inPeriod
    .filter((t) => type === 'todos' || t.type === type)
    .filter((t) => !q || `${t.description} ${t.category}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date));

  const exportCsv = () => {
    const head = 'data;tipo;categoria;descricao;valor;moeda;pais;valor_em_reais';
    const lines = rows.map((t) => [t.date, t.type, t.category, `"${t.description.replace(/"/g, '""')}"`, t.amount, t.currency, t.country, toBrl(t.amount, t.currency, fx).toFixed(2).replace('.', ',')].join(';'));
    const blob = new Blob(['﻿' + [head, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `financeiro-${from}-a-${to.slice(0, 7)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <PageHeader title="Financeiro" subtitle="Entradas e saídas do Brasil e do Paraguai. Guaranis convertidos para reais pela cotação das Configurações.">
        <ScopeTabs value={scope} onChange={setScope} />
        <button className="btn btn-primary" onClick={() => setEdit({ id: uid(), date: today(), type: 'entrada', category: INCOME_CATEGORIES[0], description: '', amount: 0, currency: scope === 'PY' ? 'PYG' : 'BRL', country: scope === 'PY' ? 'PY' : 'BR' })}>
          <Plus size={16} /> Novo lançamento
        </button>
      </PageHeader>

      <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Período">
        {PERIODS.map((p) => (
          <button key={p.id} role="tab" aria-selected={period === p.id} onClick={() => setPeriod(p.id)} className={`px-3 py-1.5 rounded-lg text-sm ${period === p.id ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Kpi label="Entradas" value={fmtBrl(income)} />
        <Kpi label="Saídas" value={fmtBrl(expense)} />
        <Kpi label="Lucro" value={fmtBrl(income - expense)} tone={income - expense >= 0 ? 'good' : 'bad'} hint={income - expense >= 0 ? 'positivo' : 'negativo'} />
        <Kpi label="Margem" value={income ? fmtPct((income - expense) / income) : '—'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        <div className="xl:col-span-1">
          <ChartCard title="Lucro por mês" subtitle="Entradas menos saídas" series={profit} labels={labels} format={(v) => fmtBrl(v)}>
            <BarChart labels={labels} series={profit} format={(v) => fmtBrl(v)} axisFormat={fmtBrlShort} height={220} />
          </ChartCard>
        </div>
        <section className="card p-4 sm:p-5">
          <h3 className="font-semibold text-slate-100 mb-3">De onde vem o dinheiro</h3>
          {cats.filter((c) => c.type === 'entrada').length ? (
            <HBars color={C.income} format={fmtBrlShort} rows={cats.filter((c) => c.type === 'entrada').map((c) => ({ label: c.category, value: c.total }))} />
          ) : <p className="text-sm text-slate-400">Sem entradas no período.</p>}
        </section>
        <section className="card p-4 sm:p-5">
          <h3 className="font-semibold text-slate-100 mb-3">Para onde vai o dinheiro</h3>
          {cats.filter((c) => c.type === 'saida').length ? (
            <HBars color={C.expense} format={fmtBrlShort} rows={cats.filter((c) => c.type === 'saida').map((c) => ({ label: c.category, value: c.total }))} />
          ) : <p className="text-sm text-slate-400">Sem saídas no período.</p>}
        </section>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="field pl-9" placeholder="Buscar lançamento" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="field w-auto" value={type} onChange={(e) => setType(e.target.value as typeof type)} aria-label="Tipo">
          <option value="todos">Entradas e saídas</option>
          <option value="entrada">Só entradas</option>
          <option value="saida">Só saídas</option>
        </select>
        <button className="btn btn-ghost" onClick={exportCsv}><Download size={16} /> Planilha (CSV)</button>
      </div>

      {rows.length === 0 ? (
        <Empty>Nenhum lançamento neste período.</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-800">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-3 py-3 font-medium">Descrição</th>
                <th className="px-3 py-3 font-medium">Categoria</th>
                <th className="px-3 py-3 font-medium text-right">Valor</th>
                <th className="px-3 py-3 font-medium text-right">Em reais</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map((t) => (
                <tr key={t.id} className="border-b border-slate-800/70 hover:bg-slate-800/30 cursor-pointer" onClick={() => setEdit(t)}>
                  <td className="px-4 py-2.5 text-slate-400 num">{fmtDate(t.date)}</td>
                  <td className="px-3 py-2.5 text-slate-200">
                    <span className="inline-flex items-center gap-1.5">
                      {t.type === 'entrada' ? <ArrowUpCircle size={15} className="text-emerald-400" aria-label="Entrada" /> : <ArrowDownCircle size={15} className="text-violet-300" aria-label="Saída" />}
                      {flag(t.country)} {t.description || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-400">{t.category}</td>
                  <td className="px-3 py-2.5 text-right num text-slate-300">{t.type === 'saida' ? '−' : '+'}{fmtMoney(t.amount, t.currency)}</td>
                  <td className={`px-3 py-2.5 text-right num ${t.type === 'entrada' ? 'text-emerald-300' : 'text-slate-200'}`}>{t.type === 'saida' ? '−' : '+'}{fmtBrl(toBrl(t.amount, t.currency, fx))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > limit && (
            <div className="p-3 flex items-center justify-between text-xs text-slate-500">
              <span>Mostrando {limit} de {rows.length}</span>
              <button className="btn btn-ghost !py-1 text-xs" onClick={() => setLimit(limit + 100)}>Mostrar mais</button>
            </div>
          )}
        </div>
      )}

      {edit && (
        <TxForm
          key={edit.id}
          tx={edit}
          exists={db.transactions.some((t) => t.id === edit.id)}
          gyms={db.gyms.map((g) => ({ id: g.id, name: g.name, country: g.country }))}
          onClose={() => setEdit(null)}
          onSave={(t) => { upsert('transactions', t); setEdit(null); }}
          onDelete={(t) => { if (confirm('Apagar este lançamento?')) { remove('transactions', t.id); setEdit(null); } }}
        />
      )}
    </>
  );
}

function TxForm({ tx, exists, gyms, onClose, onSave, onDelete }: { tx: Transaction; exists: boolean; gyms: { id: string; name: string; country: string }[]; onClose: () => void; onSave: (t: Transaction) => void; onDelete: (t: Transaction) => void }) {
  const [t, setT] = useState(tx);
  const set = <K extends keyof Transaction>(k: K, v: Transaction[K]) => setT({ ...t, [k]: v });
  const cats = t.type === 'entrada' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return (
    <Modal open title={exists ? 'Editar lançamento' : 'Novo lançamento'} onClose={onClose}>
      <form className="grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); onSave({ ...t, amount: Math.abs(t.amount), gymId: t.gymId || undefined }); }}>
        <div className="col-span-2 grid grid-cols-2 gap-2">
          {(['entrada', 'saida'] as const).map((ty) => (
            <button type="button" key={ty} onClick={() => setT({ ...t, type: ty, category: (ty === 'entrada' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0] })} className={`btn justify-center ${t.type === ty ? (ty === 'entrada' ? 'bg-emerald-600 text-white' : 'bg-violet-600 text-white') : 'btn-ghost'}`}>
              {ty === 'entrada' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />} {ty === 'entrada' ? 'Entrada' : 'Saída'}
            </button>
          ))}
        </div>
        <Field label="Data"><input className="field" type="date" required value={t.date} onChange={(e) => set('date', e.target.value)} /></Field>
        <Field label="Categoria">
          <select className="field" value={t.category} onChange={(e) => set('category', e.target.value)}>
            {cats.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Descrição" className="col-span-2"><input className="field" value={t.description} onChange={(e) => set('description', e.target.value)} /></Field>
        <Field label="Valor"><input className="field num" type="number" min={0} step="any" required value={t.amount || ''} onChange={(e) => set('amount', Number(e.target.value))} /></Field>
        <Field label="Moeda">
          <select className="field" value={t.currency} onChange={(e) => set('currency', e.target.value as Transaction['currency'])}>
            <option value="BRL">R$ (real)</option>
            <option value="PYG">Gs. (guarani)</option>
          </select>
        </Field>
        <Field label="País">
          <select className="field" value={t.country} onChange={(e) => set('country', e.target.value as Transaction['country'])}>
            <option value="BR">🇧🇷 Brasil</option>
            <option value="PY">🇵🇾 Paraguai</option>
            <option value="GERAL">🌎 Geral (empresa toda)</option>
          </select>
        </Field>
        <Field label="Academia (opcional)">
          <select className="field" value={t.gymId || ''} onChange={(e) => set('gymId', e.target.value || undefined)}>
            <option value="">—</option>
            {gyms.map((g) => <option key={g.id} value={g.id}>{flag(g.country)} {g.name}</option>)}
          </select>
        </Field>
        <div className="col-span-2 flex justify-between pt-2">
          {exists ? <button type="button" className="btn btn-ghost text-rose-300" onClick={() => onDelete(t)}><Trash2 size={16} /> Apagar</button> : <span />}
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary">Salvar</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
