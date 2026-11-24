// Contas do negócio. Tudo é calculado aqui (funções puras) para a tela, o assistente e os testes usarem a mesma regra.
import { lastMonths, monthKey, toBrl } from './format';
import { STAGES, type Country, type Db, type Gym, type Lead, type Transaction } from './types';

export type Scope = 'ALL' | Country;

const inScope = (scope: Scope, c: Country | 'GERAL') => scope === 'ALL' || c === scope;

/** A academia estava ativa (pagando ou com licença) no fim daquele mês? */
export function liveAt(g: Gym, mKey: string): boolean {
  if (g.status === 'teste') return false;
  if (g.startedAt.slice(0, 7) > mKey) return false;
  if (g.canceledAt && g.canceledAt.slice(0, 7) <= mKey) return false;
  return true;
}

export const isLiveNow = (g: Gym) => g.status === 'ativa' || g.status === 'atrasada';

export const gymMrrBrl = (g: Gym, fx: number) => (g.plan === 'saas' ? toBrl(g.monthlyFee, g.currency, fx) : 0);

export interface MonthRow {
  month: string;
  incomeBR: number;
  incomePY: number;
  income: number;
  expenseBR: number;
  expensePY: number;
  expenseGeral: number;
  expense: number;
  profit: number;
  mrrBR: number;
  mrrPY: number;
  mrr: number;
  gymsBR: number;
  gymsPY: number;
  newGyms: number;
  churned: number;
  /** cancelamentos ÷ academias ativas no começo do mês */
  churnRate: number;
}

export function monthlySeries(db: Db, months = 12, scope: Scope = 'ALL', ref = new Date()): MonthRow[] {
  const fx = db.settings.fxPygPerBrl;
  const keys = lastMonths(months, ref);
  const gyms = db.gyms.filter((g) => inScope(scope, g.country));
  const prevKey = (k: string) => {
    const [y, m] = k.split('-').map(Number);
    return new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 7);
  };
  return keys.map((k) => {
    const row: MonthRow = { month: k, incomeBR: 0, incomePY: 0, income: 0, expenseBR: 0, expensePY: 0, expenseGeral: 0, expense: 0, profit: 0, mrrBR: 0, mrrPY: 0, mrr: 0, gymsBR: 0, gymsPY: 0, newGyms: 0, churned: 0, churnRate: 0 };
    for (const t of db.transactions) {
      if (monthKey(t.date) !== k) continue;
      // filtrando um país, só entra o que é daquele país (custos "GERAL" ficam de fora)
      if (!inScope(scope, t.country)) continue;
      const v = toBrl(t.amount, t.currency, fx);
      if (t.type === 'entrada') {
        if (t.country === 'PY') row.incomePY += v;
        else row.incomeBR += v;
      } else if (t.country === 'BR') row.expenseBR += v;
      else if (t.country === 'PY') row.expensePY += v;
      else row.expenseGeral += v;
    }
    row.income = row.incomeBR + row.incomePY;
    row.expense = row.expenseBR + row.expensePY + row.expenseGeral;
    row.profit = row.income - row.expense;
    let activeStart = 0;
    const pk = prevKey(k);
    for (const g of gyms) {
      if (liveAt(g, k)) {
        if (g.country === 'BR') {
          row.gymsBR++;
          row.mrrBR += gymMrrBrl(g, fx);
        } else {
          row.gymsPY++;
          row.mrrPY += gymMrrBrl(g, fx);
        }
      }
      if (liveAt(g, pk)) activeStart++;
      if (g.status !== 'teste' && g.startedAt.slice(0, 7) === k) row.newGyms++;
      if (g.canceledAt && g.canceledAt.slice(0, 7) === k) row.churned++;
    }
    row.mrr = row.mrrBR + row.mrrPY;
    row.churnRate = activeStart ? row.churned / activeStart : 0;
    return row;
  });
}

export interface Kpis {
  gymsLive: number;
  gymsBR: number;
  gymsPY: number;
  gymsTrial: number;
  gymsOverdue: number;
  gymsCanceled: number;
  students: number;
  activeStudents: number;
  mrr: number;
  mrrBR: number;
  mrrPY: number;
  arr: number;
  arpa: number;
  incomeMonth: number;
  expenseMonth: number;
  profitMonth: number;
  /** médias dos últimos 3 meses fechados */
  income3: number;
  expense3: number;
  profit3: number;
  margin3: number;
  churn3: number;
  /** crescimento médio do MRR por mês nos últimos 3 meses */
  growth3: number;
  newGyms3: number;
  cac: number;
  ltv: number;
  paybackMonths: number;
  runwayMonths: number; // Infinity quando dá lucro
  overdueBrl: number;
  pipelineMrr: number; // MRR ponderado pela chance de fechar
  pipelineLicense: number;
  openLeads: number;
  staleReports: Gym[];
  lowUsage: Gym[];
}

export function computeKpis(db: Db, scope: Scope = 'ALL', ref = new Date()): Kpis {
  const fx = db.settings.fxPygPerBrl;
  const gyms = db.gyms.filter((g) => inScope(scope, g.country));
  const live = gyms.filter(isLiveNow);
  const series = monthlySeries(db, 7, scope, ref);
  const cur = series[series.length - 1];
  const closed = series.slice(-4, -1); // 3 meses fechados
  const avg = (f: (r: MonthRow) => number) => closed.reduce((s, r) => s + f(r), 0) / (closed.length || 1);
  const mrrBR = live.filter((g) => g.country === 'BR').reduce((s, g) => s + gymMrrBrl(g, fx), 0);
  const mrrPY = live.filter((g) => g.country === 'PY').reduce((s, g) => s + gymMrrBrl(g, fx), 0);
  const mrr = mrrBR + mrrPY;
  const income3 = avg((r) => r.income);
  const expense3 = avg((r) => r.expense);
  const profit3 = income3 - expense3;
  const churn3 = avg((r) => r.churnRate);
  const base = series[series.length - 4]?.mrr || 0;
  const growth3 = base > 0 ? Math.pow(mrr / base, 1 / 3) - 1 : 0;
  const newGyms3 = closed.reduce((s, r) => s + r.newGyms, 0);
  const since = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() - 3, 1)).toISOString().slice(0, 10);
  const until = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const acq = db.transactions
    .filter((t) => t.type === 'saida' && (t.category === 'Marketing' || t.category === 'Comissões') && t.date >= since && t.date < until && inScope(scope, t.country))
    .reduce((s, t) => s + toBrl(t.amount, t.currency, fx), 0);
  const saasLive = live.filter((g) => g.plan === 'saas');
  const arpa = saasLive.length ? mrr / saasLive.length : 0;
  const margin3 = income3 > 0 ? profit3 / income3 : 0;
  const cac = newGyms3 ? acq / newGyms3 : 0;
  const grossPerGym = arpa * 0.85; // ~15% vai para servidor e impostos
  const ltv = churn3 > 0 ? grossPerGym / churn3 : grossPerGym * 60;
  const open = db.leads.filter((l) => inScope(scope, l.country) && l.stage !== 'ganho' && l.stage !== 'perdido');
  const prob = (l: Lead) => STAGES.find((s) => s.id === l.stage)?.prob ?? 0;
  const ago = (h: number) => ref.getTime() - h * 3_600_000;
  return {
    gymsLive: live.length,
    gymsBR: live.filter((g) => g.country === 'BR').length,
    gymsPY: live.filter((g) => g.country === 'PY').length,
    gymsTrial: gyms.filter((g) => g.status === 'teste').length,
    gymsOverdue: gyms.filter((g) => g.status === 'atrasada').length,
    gymsCanceled: gyms.filter((g) => g.status === 'cancelada').length,
    students: live.reduce((s, g) => s + g.students, 0),
    activeStudents: live.reduce((s, g) => s + g.activeStudents, 0),
    mrr,
    mrrBR,
    mrrPY,
    arr: mrr * 12,
    arpa,
    incomeMonth: cur.income,
    expenseMonth: cur.expense,
    profitMonth: cur.profit,
    income3,
    expense3,
    profit3,
    margin3,
    churn3,
    growth3,
    newGyms3,
    cac,
    ltv,
    paybackMonths: cac && grossPerGym ? cac / grossPerGym : 0,
    runwayMonths: profit3 >= 0 ? Infinity : db.settings.cashBrl / -profit3,
    overdueBrl: gyms.filter((g) => g.status === 'atrasada').reduce((s, g) => s + gymMrrBrl(g, fx), 0),
    pipelineMrr: open.filter((l) => l.plan === 'saas').reduce((s, l) => s + toBrl(l.value, l.country === 'BR' ? 'BRL' : 'PYG', fx) * prob(l), 0),
    pipelineLicense: open.filter((l) => l.plan === 'licenca').reduce((s, l) => s + toBrl(l.value, l.country === 'BR' ? 'BRL' : 'PYG', fx) * prob(l), 0),
    openLeads: open.length,
    staleReports: live.filter((g) => g.lastReportAt && Date.parse(g.lastReportAt) < ago(48)),
    lowUsage: live.filter((g) => g.students >= 20 && g.activeStudents / g.students < 0.3),
  };
}

/** Totais por categoria num período (para o financeiro). */
export function byCategory(txs: Transaction[], fx: number) {
  const map = new Map<string, { type: Transaction['type']; total: number }>();
  for (const t of txs) {
    const k = `${t.type}|${t.category}`;
    const cur = map.get(k) ?? { type: t.type, total: 0 };
    cur.total += toBrl(t.amount, t.currency, fx);
    map.set(k, cur);
  }
  return [...map.entries()].map(([k, v]) => ({ category: k.split('|')[1], ...v })).sort((a, b) => b.total - a.total);
}

// ------------------------------------------------------------------ saúde do negócio (regras)

export type Level = 'good' | 'warning' | 'critical' | 'info';
export interface Insight {
  level: Level;
  title: string;
  text: string;
}

export interface Health {
  score: number; // 0–100
  verdict: string;
  parts: { label: string; points: number; max: number; note: string }[];
  insights: Insight[];
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const pct = (v: number) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
const n1 = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export function businessHealth(db: Db, scope: Scope = 'ALL', ref = new Date()): Health {
  const k = computeKpis(db, scope, ref);
  const parts: Health['parts'] = [];
  const insights: Insight[] = [];

  // 1) lucro (25)
  const pMargin = k.income3 <= 0 ? 0 : clamp(((k.margin3 + 0.2) / 0.5) * 25, 0, 25); // -20% → 0 · 30% → 25
  parts.push({ label: 'Lucro', points: pMargin, max: 25, note: `margem média de ${pct(k.margin3)} nos últimos 3 meses` });
  // 2) crescimento (25)
  const pGrowth = clamp((k.growth3 / 0.08) * 25, 0, 25); // 8% ao mês → nota cheia
  parts.push({ label: 'Crescimento', points: pGrowth, max: 25, note: `receita recorrente crescendo ${pct(k.growth3)} ao mês` });
  // 3) cancelamentos (20)
  const pChurn = clamp(((0.08 - k.churn3) / 0.06) * 20, 0, 20); // ≤2% → cheia · ≥8% → zero
  parts.push({ label: 'Retenção', points: pChurn, max: 20, note: `${pct(k.churn3)} das academias cancelam por mês` });
  // 4) caixa (15)
  const pCash = k.runwayMonths === Infinity ? 15 : clamp((k.runwayMonths / 12) * 15, 0, 15);
  parts.push({ label: 'Caixa', points: pCash, max: 15, note: k.runwayMonths === Infinity ? 'o negócio se paga sozinho' : `o caixa aguenta ${n1(k.runwayMonths)} meses` });
  // 5) uso e cobrança (15)
  const usage = k.students ? k.activeStudents / k.students : 0;
  const pUse = clamp(((usage - 0.3) / 0.35) * 10, 0, 10) + (k.gymsLive ? clamp(5 - (k.gymsOverdue / k.gymsLive) * 25, 0, 5) : 0);
  parts.push({ label: 'Uso e cobrança', points: pUse, max: 15, note: `${pct(usage)} dos alunos ativos · ${k.gymsOverdue} academia(s) atrasada(s)` });

  const score = Math.round(parts.reduce((s, p) => s + p.points, 0));
  const verdict =
    score >= 75 ? 'O negócio está saudável e crescendo.' : score >= 55 ? 'O negócio está no caminho, com pontos de atenção.' : score >= 35 ? 'O negócio precisa de ajustes para ficar de pé.' : 'Alerta: o negócio está perdendo dinheiro ou clientes rápido demais.';

  // ----- observações
  if (k.profit3 >= 0) insights.push({ level: 'good', title: 'Dando lucro', text: `Média de ${brl(k.profit3)} de lucro por mês nos últimos 3 meses (margem ${pct(k.margin3)}).` });
  else insights.push({ level: k.runwayMonths < 6 ? 'critical' : 'warning', title: 'Gastando mais do que entra', text: `Prejuízo médio de ${brl(-k.profit3)} por mês. Com o caixa de ${brl(db.settings.cashBrl)}, dá para ${n1(k.runwayMonths)} meses.` });

  if (k.growth3 >= 0.05) insights.push({ level: 'good', title: 'Crescimento forte', text: `A receita mensal (MRR) cresce ${pct(k.growth3)} ao mês. Nesse ritmo, dobra em ${Math.ceil(Math.log(2) / Math.log(1 + k.growth3))} meses.` });
  else if (k.growth3 > 0) insights.push({ level: 'info', title: 'Crescimento lento', text: `O MRR cresce ${pct(k.growth3)} ao mês. Para acelerar, foque nos leads em proposta e negociação.` });
  else insights.push({ level: 'warning', title: 'Receita parada ou caindo', text: 'O MRR não cresceu nos últimos 3 meses. Reveja cancelamentos e o ritmo de vendas.' });

  if (k.churn3 > 0.04) insights.push({ level: 'critical', title: 'Cancelamentos altos', text: `${pct(k.churn3)} das academias cancelam por mês (o saudável é abaixo de 2–3%). Ligue para quem tem pouco uso antes que cancele.` });
  else if (k.churn3 > 0.02) insights.push({ level: 'warning', title: 'Cancelamentos acima do ideal', text: `${pct(k.churn3)} ao mês. Acompanhe de perto as academias com poucos alunos ativos.` });
  else insights.push({ level: 'good', title: 'Clientes ficando', text: `Só ${pct(k.churn3)} de cancelamento por mês.` });

  if (k.gymsOverdue) insights.push({ level: 'warning', title: `${k.gymsOverdue} academia(s) com pagamento atrasado`, text: `São ${brl(k.overdueBrl)} por mês em aberto. Cobre hoje pelo WhatsApp.` });
  if (k.lowUsage.length) insights.push({ level: 'warning', title: 'Risco de cancelamento', text: `${k.lowUsage.map((g) => g.name).join(', ')}: menos de 30% dos alunos usaram o app no último mês. Ofereça um treinamento para a equipe.` });
  if (k.staleReports.length) insights.push({ level: 'warning', title: 'Servidor sem dar notícia', text: `${k.staleReports.map((g) => g.name).join(', ')} não manda o resumo diário há mais de 2 dias. Confira se o servidor está no ar.` });
  if (k.cac > 0 && k.paybackMonths > 0) {
    const lvl: Level = k.paybackMonths <= 6 ? 'good' : k.paybackMonths <= 12 ? 'info' : 'warning';
    insights.push({ level: lvl, title: 'Custo para conquistar cada academia', text: `${brl(k.cac)} em anúncios e comissões por academia nova; volta em ${n1(k.paybackMonths)} meses de mensalidade. Cada cliente vale cerca de ${brl(k.ltv)} ao longo da vida.` });
  }
  if (k.pipelineMrr > 0) insights.push({ level: 'info', title: 'Funil de vendas', text: `${k.openLeads} negociação(ões) abertas. Pela chance de cada etapa, devem virar cerca de ${brl(k.pipelineMrr)} a mais de MRR${k.pipelineLicense ? ` e ${brl(k.pipelineLicense)} em licenças` : ''}.` });
  if (scope === 'ALL' && k.mrr > 0) {
    const share = k.mrrPY / k.mrr;
    insights.push({ level: 'info', title: 'Brasil × Paraguai', text: `Brasil ${brl(k.mrrBR)} (${pct(1 - share)}) e Paraguai ${brl(k.mrrPY)} (${pct(share)}) de receita mensal.` });
  }
  const rank: Record<Level, number> = { critical: 0, warning: 1, good: 2, info: 3 };
  insights.sort((a, b) => rank[a.level] - rank[b.level]);
  return { score, verdict, parts, insights };
}

/** Resumo curto (só números, sem nomes de pessoas) que vai para a IA quando o chat está ligado. */
export function summaryForAi(db: Db, ref = new Date()): string {
  const k = computeKpis(db, 'ALL', ref);
  const h = businessHealth(db, 'ALL', ref);
  const s = monthlySeries(db, 12, 'ALL', ref);
  const r = (v: number) => Math.round(v);
  return JSON.stringify({
    data: ref.toISOString().slice(0, 10),
    moeda: 'BRL (guaranis convertidos pela cotação ' + db.settings.fxPygPerBrl + ' PYG por BRL)',
    precos: { saas_BR: 'R$ 350/mês', saas_PY: 'Gs. 400.000/mês', licenca_BR: 'R$ 17.997', licenca_PY: 'Gs. 28.000.000' },
    academias: { ativas: k.gymsLive, brasil: k.gymsBR, paraguai: k.gymsPY, em_teste: k.gymsTrial, atrasadas: k.gymsOverdue, canceladas_total: k.gymsCanceled },
    alunos: { total: k.students, ativos_30d: k.activeStudents },
    receita: { mrr: r(k.mrr), mrr_brasil: r(k.mrrBR), mrr_paraguai: r(k.mrrPY), arr: r(k.arr), ticket_medio: r(k.arpa) },
    ultimos_3_meses_media: { entradas: r(k.income3), saidas: r(k.expense3), lucro: r(k.profit3), margem: +k.margin3.toFixed(3), cancelamento_mensal: +k.churn3.toFixed(3), crescimento_mrr_mensal: +k.growth3.toFixed(3) },
    unidade: { cac: r(k.cac), ltv: r(k.ltv), payback_meses: +k.paybackMonths.toFixed(1) },
    caixa: { saldo: db.settings.cashBrl, meses_de_folego: k.runwayMonths === Infinity ? 'dá lucro' : +k.runwayMonths.toFixed(1) },
    funil: { negociacoes_abertas: k.openLeads, mrr_ponderado: r(k.pipelineMrr), licencas_ponderado: r(k.pipelineLicense) },
    nota_saude: h.score,
    historico_mensal: s.map((m) => ({ mes: m.month, entradas: r(m.income), saidas: r(m.expense), mrr: r(m.mrr), academias: m.gymsBR + m.gymsPY, novas: m.newGyms, canceladas: m.churned })),
  });
}
