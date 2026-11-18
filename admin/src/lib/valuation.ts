// Calculadora de valor da empresa (valuation) e de participação de investidores (equity).
// É uma ESTIMATIVA pelo método de múltiplo de receita recorrente anual (ARR), o mais usado para SaaS
// pequeno. Referências de 2026: SaaS privado com menos de US$ 1 mi de ARR costuma valer ~2,5–4× o ARR;
// a mediana de SaaS privado fica perto de 4,5× (faixa de 3–7×). Quem decide o preço é a negociação.

export interface ValuationInput {
  gymsBR: number;
  gymsPY: number;
  priceBR: number; // R$ por mês
  pricePY: number; // Gs. por mês
  fx: number; // Gs. por R$
  churnMonthly: number; // 0.02 = 2% ao mês
  growthYearly: number; // 0.5 = 50% ao ano
  margin: number; // margem de lucro (0.2 = 20%)
  oneOffYear: number; // receita não recorrente do ano (licenças, implantação), em R$
}

export interface Scenario {
  id: 'conservador' | 'base' | 'otimista';
  label: string;
  baseMultiple: number;
  multiple: number;
  value: number;
}

export interface ValuationResult {
  mrr: number;
  arr: number;
  mrrBR: number;
  mrrPY: number;
  adjust: { growth: number; churn: number; margin: number; total: number };
  ruleOf40: number; // crescimento + margem, em %
  scenarios: Scenario[];
  perGym: number; // valor do cenário base dividido pelo nº de academias
}

export const BASE_MULTIPLES = { conservador: 2.5, base: 4, otimista: 6 } as const;

export function growthFactor(g: number) {
  if (g < 0.1) return 0.7;
  if (g < 0.3) return 0.9;
  if (g < 0.6) return 1;
  if (g < 1) return 1.15;
  return 1.3;
}
export function churnFactor(c: number) {
  if (c <= 0.015) return 1.1;
  if (c <= 0.03) return 1;
  if (c <= 0.05) return 0.85;
  return 0.7;
}
export function marginFactor(m: number) {
  if (m >= 0.3) return 1.1;
  if (m >= 0.1) return 1;
  if (m >= 0) return 0.9;
  return 0.8;
}

export function valuate(i: ValuationInput): ValuationResult {
  const mrrBR = i.gymsBR * i.priceBR;
  const mrrPY = (i.gymsPY * i.pricePY) / (i.fx || 1);
  const mrr = mrrBR + mrrPY;
  const arr = mrr * 12;
  const adjust = { growth: growthFactor(i.growthYearly), churn: churnFactor(i.churnMonthly), margin: marginFactor(i.margin), total: 1 };
  adjust.total = adjust.growth * adjust.churn * adjust.margin;
  const scenarios: Scenario[] = (
    [
      ['conservador', 'Conservador'],
      ['base', 'Base'],
      ['otimista', 'Otimista'],
    ] as const
  ).map(([id, label]) => {
    const multiple = BASE_MULTIPLES[id] * adjust.total;
    // receita que não se repete (licenças) vale no máximo 1× — comprador paga pelo que é recorrente
    return { id, label, baseMultiple: BASE_MULTIPLES[id], multiple, value: arr * multiple + Math.max(0, i.oneOffYear) };
  });
  const gyms = i.gymsBR + i.gymsPY;
  return {
    mrr,
    arr,
    mrrBR,
    mrrPY,
    adjust,
    ruleOf40: (i.growthYearly + i.margin) * 100,
    scenarios,
    perGym: gyms ? scenarios[1].value / gyms : 0,
  };
}

// ------------------------------------------------------------------ investidor

export interface Holder {
  id: string;
  name: string;
  pct: number; // participação ANTES da rodada (somam 100)
}

export interface RoundInput {
  preMoney: number;
  investment: number;
  /** Reserva de ações para funcionários/sócios futuros, em % DEPOIS da rodada (sai dos sócios atuais). */
  poolPct: number;
  holders: Holder[];
}

export interface CapRow {
  name: string;
  before: number; // %
  after: number; // %
  value: number; // R$ pelo valor pós-rodada
  kind: 'socio' | 'investidor' | 'reserva';
}

export interface RoundResult {
  postMoney: number;
  investorPct: number; // %
  dilution: number; // quanto cada sócio atual perde, em % da própria parte
  rows: CapRow[];
  warning?: string;
}

export function round(i: RoundInput): RoundResult {
  const pre = Math.max(0, i.preMoney);
  const inv = Math.max(0, i.investment);
  const post = pre + inv;
  const investorPct = post ? (inv / post) * 100 : 0;
  const pool = Math.max(0, Math.min(50, i.poolPct));
  const left = Math.max(0, 100 - investorPct - pool);
  const totalBefore = i.holders.reduce((s, h) => s + Math.max(0, h.pct), 0) || 1;
  const rows: CapRow[] = i.holders.map((h) => {
    const before = (Math.max(0, h.pct) / totalBefore) * 100;
    const after = (before / 100) * left;
    return { name: h.name || 'Sócio', before, after, value: (after / 100) * post, kind: 'socio' };
  });
  if (pool > 0) rows.push({ name: 'Reserva (opções)', before: 0, after: pool, value: (pool / 100) * post, kind: 'reserva' });
  if (inv > 0) rows.push({ name: 'Investidor', before: 0, after: investorPct, value: inv, kind: 'investidor' });
  let warning: string | undefined;
  if (investorPct > 35) warning = 'O investidor ficaria com mais de 35% numa rodada só. Em rodadas iniciais o comum é ceder 10–25%.';
  const sum = i.holders.reduce((s, h) => s + h.pct, 0);
  if (i.holders.length && Math.abs(sum - 100) > 0.01) warning = `As participações dos sócios somam ${sum.toFixed(1)}%. Foram ajustadas para 100% na conta.`;
  return { postMoney: post, investorPct, dilution: 100 - left, rows, warning };
}
