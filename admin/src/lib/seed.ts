// Dados de EXEMPLO para o modo demonstração. Nomes e números são fictícios.
// As datas são calculadas a partir de hoje, para a demonstração sempre parecer "atual".
import type { Country, Db, Gym, Lead, LeadActivity, LeadStage, Transaction } from './types';
import { DEFAULT_SETTINGS } from './defaults';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BR_CITIES = ['Garanhuns', 'Recife', 'Caruaru', 'Foz do Iguaçu', 'Cascavel', 'Campo Grande', 'Dourados', 'Ponta Porã', 'Toledo', 'Maringá', 'Londrina', 'Petrolina', 'Arapiraca', 'Chapecó', 'Umuarama', 'Guaíra', 'Caruaru', 'Olinda'];
const PY_CITIES = ['Asunción', 'Ciudad del Este', 'Encarnación', 'Pedro Juan Caballero', 'Luque', 'San Lorenzo', 'Hernandarias', 'Coronel Oviedo', 'Caaguazú', 'Salto del Guairá', 'Lambaré', 'Fernando de la Mora'];
const BR_NAMES = ['Força Total', 'Corpo em Ação', 'Ferro & Foco', 'Academia Atlas', 'Studio Movimento', 'Power Fit', 'Academia Evolução', 'Templo do Ferro', 'Vida Ativa', 'Box Norte', 'Academia Impacto', 'Fit Center', 'Academia Titã', 'Ritmo Fitness', 'Academia Pulso', 'Shape Club', 'Academia Prime', 'Energia Fit'];
const PY_NAMES = ['Gimnasio Fuerza', 'Iron Gym PY', 'Cuerpo Activo', 'Gimnasio Titán', 'Fit Club Este', 'Gimnasio Impacto', 'Power House', 'Gimnasio Vital', 'Box Sur', 'Energía Gym', 'Gimnasio Olimpo', 'Movimiento Fit'];
const BR_PEOPLE = ['Carlos Mendes', 'Ana Paula Rocha', 'Ricardo Lima', 'Fernanda Alves', 'Bruno Costa', 'Juliana Freitas', 'Marcos Vieira', 'Patrícia Gomes', 'Rafael Nunes', 'Camila Duarte', 'Diego Moura', 'Larissa Pinto', 'Thiago Barros', 'Renata Melo', 'Felipe Cardoso', 'Aline Teixeira', 'Gustavo Reis', 'Bianca Lopes'];
const PY_PEOPLE = ['Juan Benítez', 'María Giménez', 'Diego Acosta', 'Laura Duarte', 'Carlos Ayala', 'Sofía Villalba', 'Luis Báez', 'Paola Ortiz', 'Hugo Cáceres', 'Natalia Rojas', 'Andrés Insfrán', 'Lucía Martínez'];

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
const monthStart = (ref: Date, back: number) => new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() - back, 1));

export function buildSeed(now = new Date()): Db {
  const r = rng(20261116);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const between = (a: number, b: number) => Math.round(a + r() * (b - a));
  let n = 0;
  const id = (p: string) => `${p}-${(++n).toString(36)}`;

  // ---------- academias: entradas ao longo de 12 meses (crescendo), algumas canceladas
  const gyms: Gym[] = [];
  const plan: { c: Country; back: number; status?: Gym['status']; licenca?: boolean }[] = [];
  const brSchedule = [11, 11, 10, 9, 9, 8, 7, 7, 6, 5, 4, 4, 3, 2, 2, 1, 1, 0];
  const pySchedule = [11, 9, 8, 7, 6, 5, 4, 3, 3, 2, 1, 0];
  brSchedule.forEach((back) => plan.push({ c: 'BR', back }));
  pySchedule.forEach((back) => plan.push({ c: 'PY', back }));
  // duas licenças (venda única), uma em cada país
  plan[3].licenca = true;
  plan[brSchedule.length + 2].licenca = true;

  let bi = 0;
  let pi = 0;
  for (const p of plan) {
    const isBr = p.c === 'BR';
    const idx = isBr ? bi++ : pi++;
    const start = addDays(monthStart(now, p.back), between(0, 20));
    const students = between(70, 420);
    const g: Gym = {
      id: id('gym'),
      name: isBr ? BR_NAMES[idx % BR_NAMES.length] : PY_NAMES[idx % PY_NAMES.length],
      city: isBr ? BR_CITIES[idx % BR_CITIES.length] : PY_CITIES[idx % PY_CITIES.length],
      country: p.c,
      plan: p.licenca ? 'licenca' : 'saas',
      status: 'ativa',
      monthlyFee: p.licenca ? 0 : isBr ? 350 : 400000,
      currency: isBr ? 'BRL' : 'PYG',
      ownerName: isBr ? BR_PEOPLE[idx % BR_PEOPLE.length] : PY_PEOPLE[idx % PY_PEOPLE.length],
      phone: isBr ? `55879${between(10000000, 99999999)}` : `5959${between(81000000, 99999999)}`,
      startedAt: iso(start > now ? now : start),
      token: id('tok') + Math.floor(r() * 1e9).toString(36),
      notes: '',
      students,
      activeStudents: Math.round(students * (0.45 + r() * 0.35)),
      workouts30d: 0,
      checkins30d: 0,
      lastReportAt: new Date(now.getTime() - between(1, 20) * 3_600_000).toISOString(),
    };
    g.workouts30d = Math.round(g.activeStudents * (6 + r() * 6));
    g.checkins30d = Math.round(g.activeStudents * (7 + r() * 5));
    gyms.push(g);
  }
  // situações para o assistente comentar
  const br = gyms.filter((g) => g.country === 'BR');
  const py = gyms.filter((g) => g.country === 'PY');
  const cancel = (g: Gym, back: number) => {
    g.status = 'cancelada';
    g.canceledAt = iso(addDays(monthStart(now, back), between(3, 25)));
    g.activeStudents = 0;
    g.workouts30d = 0;
    g.checkins30d = 0;
    g.notes = 'Cancelou: achou caro / pouca adesão dos alunos.';
  };
  cancel(br[1], 5);
  cancel(br[6], 1);
  cancel(py[1], 3);
  br[4].status = 'atrasada';
  br[4].notes = 'Mensalidade deste mês em aberto.';
  py[4].status = 'atrasada';
  br[br.length - 1].status = 'teste';
  py[py.length - 1].status = 'teste';
  // academia com pouco uso (risco de cancelar) e servidor que parou de mandar resumo
  br[8].activeStudents = Math.round(br[8].students * 0.18);
  br[8].workouts30d = br[8].activeStudents * 4;
  br[8].checkins30d = br[8].activeStudents * 5;
  py[5].lastReportAt = new Date(now.getTime() - 6 * 86_400_000).toISOString();

  // ---------- lançamentos (entradas e saídas) dos últimos 12 meses
  const tx: Transaction[] = [];
  const add = (t: Omit<Transaction, 'id'>) => tx.push({ id: id('tx'), ...t });
  for (let back = 11; back >= 0; back--) {
    const ms = monthStart(now, back);
    const mKey = iso(ms).slice(0, 7);
    const day = (d: number) => {
      const dt = addDays(ms, d - 1);
      return iso(dt > now ? now : dt);
    };
    const activeIn = (g: Gym) =>
      g.startedAt.slice(0, 7) <= mKey && (!g.canceledAt || g.canceledAt.slice(0, 7) > mKey) && g.status !== 'teste';
    let brIncome = 0;
    let serversBr = 0;
    let serversPy = 0;
    let newSalesBr = 0;
    let newSalesPy = 0;
    for (const g of gyms) {
      if (g.startedAt.slice(0, 7) === mKey && g.status !== 'teste') {
        if (g.plan === 'licenca') {
          const v = g.country === 'BR' ? 17997 : 28000000;
          add({ date: g.startedAt, type: 'entrada', category: 'Licença', description: `Licença de uso — ${g.name}`, amount: v, currency: g.currency, country: g.country, gymId: g.id });
          if (g.country === 'BR') brIncome += v;
          g.country === 'BR' ? (newSalesBr += v * 0.1) : (newSalesPy += v * 0.1);
        } else {
          g.country === 'BR' ? (newSalesBr += 350) : (newSalesPy += 400000);
          if (r() < 0.5) {
            const imp = g.country === 'BR' ? 500 : 800000;
            add({ date: g.startedAt, type: 'entrada', category: 'Implantação', description: `Implantação — ${g.name}`, amount: imp, currency: g.currency, country: g.country, gymId: g.id });
            if (g.country === 'BR') brIncome += imp;
          }
        }
      }
      if (!activeIn(g)) continue;
      if (g.country === 'BR') serversBr += 1;
      else serversPy += 1;
      if (g.plan !== 'saas') continue;
      if (back === 0 && g.status === 'atrasada') continue; // atrasada: não pagou este mês
      const d = day(between(3, 10));
      if (back === 0 && d > iso(now)) continue;
      add({ date: d, type: 'entrada', category: 'Mensalidade SaaS', description: `Mensalidade — ${g.name}`, amount: g.monthlyFee, currency: g.currency, country: g.country, gymId: g.id });
      if (g.country === 'BR') brIncome += g.monthlyFee;
    }
    const out = (date: string, category: string, description: string, amount: number, currency: 'BRL' | 'PYG', country: Transaction['country']) =>
      date <= iso(now) && add({ date, type: 'saida', category, description, amount: Math.round(amount), currency, country });
    out(day(2), 'Servidores', 'VPS e Cloudflare (academias do Brasil)', 40 * serversBr + 30, 'BRL', 'BR');
    out(day(2), 'Servidores', 'VPS (academias do Paraguai)', 45000 * serversPy, 'PYG', 'PY');
    out(day(5), 'Marketing', 'Anúncios Meta (Brasil)', between(700, 1300), 'BRL', 'BR');
    out(day(5), 'Marketing', 'Anuncios Meta (Paraguay)', between(1200000, 2200000), 'PYG', 'PY');
    out(day(10), 'Ferramentas', 'Ferramentas e assinaturas', 260, 'BRL', 'GERAL');
    out(day(15), 'Contador', 'Contabilidade', 400, 'BRL', 'BR');
    if (newSalesBr) out(day(20), 'Comissões', 'Comissão de vendas (Brasil)', newSalesBr * 0.5, 'BRL', 'BR');
    if (newSalesPy) out(day(20), 'Comissões', 'Comisión de ventas (Paraguay)', newSalesPy * 0.5, 'PYG', 'PY');
    out(day(20), 'Impostos', 'Simples Nacional', brIncome * 0.06, 'BRL', 'BR');
    if (back <= 6) out(day(28), 'Pró-labore', 'Pró-labore', 2500, 'BRL', 'GERAL');
    if (back % 12 === 3) out(day(12), 'Domínios', 'Renovação de domínios', 180, 'BRL', 'GERAL');
  }

  // ---------- CRM: leads em várias etapas
  const leads: Lead[] = [];
  const activities: LeadActivity[] = [];
  const stages: LeadStage[] = ['lead', 'lead', 'lead', 'lead', 'contato', 'contato', 'contato', 'demo', 'demo', 'demo', 'proposta', 'proposta', 'negociacao', 'negociacao', 'ganho', 'ganho', 'perdido', 'perdido', 'lead', 'contato', 'demo', 'proposta'];
  const nextByStage: Record<LeadStage, string> = {
    lead: 'Primeiro contato pelo WhatsApp',
    contato: 'Agendar demonstração',
    demo: 'Enviar proposta',
    proposta: 'Cobrar retorno da proposta',
    negociacao: 'Fechar contrato',
    ganho: 'Implantação',
    perdido: '',
  };
  const usedNames = new Set(gyms.map((g) => g.name));
  stages.forEach((stage, i) => {
    const c: Country = i % 3 === 2 ? 'PY' : 'BR';
    const isBr = c === 'BR';
    const created = addDays(now, -between(2, 75));
    const updated = addDays(created, between(0, Math.max(0, Math.floor((now.getTime() - created.getTime()) / 86_400_000))));
    const licenca = i === 11 || i === 13;
    let gymName = '';
    do {
      gymName = isBr ? `${pick(['Academia', 'Studio', 'Box', 'Espaço'])} ${pick(['Alpha', 'Vitória', 'Centro', 'Bela Vista', 'Horizonte', 'Ferro Forte', 'Saúde', 'Max', 'Ativa', 'Família'])}` : `${pick(['Gimnasio', 'Studio', 'Box'])} ${pick(['Central', 'Norte', 'Fénix', 'Max', 'Familia', 'Activo', 'Elite'])}`;
    } while (usedNames.has(gymName));
    usedNames.add(gymName);
    const lead: Lead = {
      id: id('lead'),
      gymName,
      contactName: isBr ? pick(BR_PEOPLE) : pick(PY_PEOPLE),
      phone: isBr ? `55879${between(10000000, 99999999)}` : `5959${between(81000000, 99999999)}`,
      email: '',
      city: isBr ? pick(BR_CITIES) : pick(PY_CITIES),
      country: c,
      stage,
      plan: licenca ? 'licenca' : 'saas',
      value: licenca ? (isBr ? 17997 : 28000000) : isBr ? 350 : 400000,
      source: pick(['Indicação', 'Instagram', 'Meta Ads', 'Site', 'Visita', 'WhatsApp']),
      students: between(60, 500),
      nextAction: nextByStage[stage],
      nextActionDate: stage === 'ganho' || stage === 'perdido' ? undefined : iso(addDays(now, between(-4, 7))),
      lostReason: stage === 'perdido' ? pick(['Achou caro', 'Já usa outro sistema', 'Não respondeu mais']) : undefined,
      createdAt: created.toISOString(),
      updatedAt: (updated > now ? now : updated).toISOString(),
    };
    leads.push(lead);
    const steps: [LeadActivity['kind'], string][] = [['whatsapp', 'Primeira mensagem enviada com o link da demonstração.']];
    if (['contato', 'demo', 'proposta', 'negociacao', 'ganho', 'perdido'].includes(stage)) steps.push(['ligacao', 'Conversamos por telefone; dono gostou do check-in por QR.']);
    if (['demo', 'proposta', 'negociacao', 'ganho'].includes(stage)) steps.push(['demo', 'Demonstração feita na academia com o professor junto.']);
    if (['proposta', 'negociacao', 'ganho'].includes(stage)) steps.push(['proposta', licenca ? 'Proposta de licença enviada.' : 'Proposta do plano mensal enviada.']);
    steps.forEach(([kind, text], k) =>
      activities.push({ id: id('act'), leadId: lead.id, kind, text, date: addDays(created, k * between(1, 4)).toISOString() }),
    );
  });

  return { gyms, transactions: tx.sort((a, b) => a.date.localeCompare(b.date)), leads, activities, settings: { ...DEFAULT_SETTINGS } };
}
