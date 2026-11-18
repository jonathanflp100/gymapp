import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSeed } from './seed';
import { businessHealth, computeKpis, liveAt, monthlySeries, summaryForAi } from './metrics';
import { round, valuate } from './valuation';
import { _internals } from './backend';
import type { Db, Gym } from './types';

const ref = new Date('2026-11-16T12:00:00Z');
const seed = () => buildSeed(ref);

test('dados de exemplo são consistentes', () => {
  const db = seed();
  assert.ok(db.gyms.length >= 25);
  assert.ok(db.gyms.some((g) => g.country === 'BR') && db.gyms.some((g) => g.country === 'PY'));
  assert.ok(db.transactions.every((t) => t.amount >= 0 && t.date <= '2026-11-16'));
  assert.ok(db.leads.every((l) => db.activities.some((a) => a.leadId === l.id)));
  // determinístico
  assert.deepEqual(buildSeed(ref).gyms.map((g) => g.name), db.gyms.map((g) => g.name));
});

test('academia ativa por mês respeita início, cancelamento e teste', () => {
  const g = { startedAt: '2026-03-10', status: 'cancelada', canceledAt: '2026-07-02' } as Gym;
  assert.equal(liveAt(g, '2026-02'), false);
  assert.equal(liveAt(g, '2026-03'), true);
  assert.equal(liveAt(g, '2026-06'), true);
  assert.equal(liveAt(g, '2026-07'), false);
  assert.equal(liveAt({ ...g, status: 'teste', canceledAt: undefined }, '2026-08'), false);
});

test('MRR converte guaranis pela cotação', () => {
  const db: Db = { ...seed(), transactions: [], leads: [], activities: [] };
  db.gyms = [
    { ...db.gyms[0], country: 'BR', currency: 'BRL', plan: 'saas', monthlyFee: 350, status: 'ativa' },
    { ...db.gyms[1], country: 'PY', currency: 'PYG', plan: 'saas', monthlyFee: 550000, status: 'ativa' },
    { ...db.gyms[2], country: 'PY', currency: 'PYG', plan: 'licenca', monthlyFee: 0, status: 'ativa' },
  ];
  db.settings.fxPygPerBrl = 1100;
  const k = computeKpis(db, 'ALL', ref);
  assert.equal(k.mrrBR, 350);
  assert.equal(k.mrrPY, 500);
  assert.equal(k.mrr, 850);
  assert.equal(k.arr, 10200);
  assert.equal(computeKpis(db, 'PY', ref).mrr, 500);
});

test('série mensal soma entradas e saídas por país', () => {
  const db = seed();
  db.transactions = [
    { id: '1', date: '2026-11-05', type: 'entrada', category: 'x', description: '', amount: 1000, currency: 'BRL', country: 'BR' },
    { id: '2', date: '2026-11-06', type: 'entrada', category: 'x', description: '', amount: 1171360, currency: 'PYG', country: 'PY' },
    { id: '3', date: '2026-11-07', type: 'saida', category: 'x', description: '', amount: 300, currency: 'BRL', country: 'GERAL' },
  ];
  const s = monthlySeries(db, 2, 'ALL', ref);
  const nov = s[1];
  assert.equal(nov.month, '2026-11');
  assert.equal(Math.round(nov.incomePY), 1000);
  assert.equal(Math.round(nov.profit), 1700);
  // filtrando o Brasil, o custo GERAL fica de fora
  assert.equal(monthlySeries(db, 1, 'BR', ref)[0].expense, 0);
});

test('saúde do negócio dá nota de 0 a 100 e observações', () => {
  const h = businessHealth(seed(), 'ALL', ref);
  assert.ok(h.score >= 0 && h.score <= 100);
  assert.ok(h.insights.length >= 4);
  assert.ok(h.insights.some((i) => i.title.includes('atrasado')));
  assert.ok(h.insights.some((i) => i.title === 'Risco de cancelamento'));
  assert.ok(h.insights.some((i) => i.title === 'Servidor sem dar notícia'));
});

test('resumo para a IA não leva nomes nem telefones', () => {
  const db = seed();
  const s = summaryForAi(db, ref);
  for (const g of db.gyms) {
    assert.ok(!s.includes(g.ownerName), g.ownerName);
    assert.ok(!s.includes(g.phone));
  }
  for (const l of db.leads) assert.ok(!s.includes(l.phone));
  assert.doesNotThrow(() => JSON.parse(s));
});

test('valuation de 1000 academias (500 BR + 500 PY)', () => {
  const v = valuate({ gymsBR: 500, gymsPY: 500, priceBR: 350, pricePY: 550000, fx: 1171.36, churnMonthly: 0.02, growthYearly: 0.4, margin: 0.35, oneOffYear: 0 });
  assert.equal(v.mrrBR, 175000);
  assert.ok(Math.abs(v.mrrPY - 234769) < 1);
  assert.ok(Math.abs(v.arr - 4_917_229) < 10);
  assert.equal(v.adjust.total, 1.1); // crescimento 1 · churn 1 · margem 1.1
  assert.ok(Math.abs(v.scenarios[1].value - v.arr * 4.4) < 1);
  assert.ok(v.scenarios[0].value < v.scenarios[1].value && v.scenarios[1].value < v.scenarios[2].value);
});

test('rodada: pre 1 mi + 250 mil = investidor com 20%', () => {
  const r = round({ preMoney: 1_000_000, investment: 250_000, poolPct: 10, holders: [{ id: 'a', name: 'A', pct: 60 }, { id: 'b', name: 'B', pct: 40 }] });
  assert.equal(r.postMoney, 1_250_000);
  assert.equal(r.investorPct, 20);
  const a = r.rows.find((x) => x.name === 'A')!;
  assert.ok(Math.abs(a.after - 42) < 1e-9); // 60% de 70%
  assert.ok(Math.abs(r.rows.reduce((s, x) => s + x.after, 0) - 100) < 1e-9);
  assert.equal(r.warning, undefined);
});

test('conversão de nomes para o Supabase', () => {
  const row = _internals.toDb({ activeStudents: 3, workouts30d: 9, gymId: '', nextActionDate: undefined, notes: '' });
  assert.deepEqual(row, { active_students: 3, workouts30d: 9, gym_id: null, next_action_date: null, notes: '' });
  assert.deepEqual(_internals.fromDb({ monthly_fee: '350.00', last_report_at: null, name: 'X' }), { monthlyFee: 350, name: 'X' });
});
