// Tipos do painel administrativo. Os nomes dos campos batem com as colunas do Supabase (snake_case lá, camelCase aqui).

export type Country = 'BR' | 'PY';
export type Currency = 'BRL' | 'PYG';
export type GymPlan = 'saas' | 'licenca';
export type GymStatus = 'teste' | 'ativa' | 'atrasada' | 'cancelada';

export interface Gym {
  id: string;
  name: string;
  city: string;
  country: Country;
  plan: GymPlan;
  status: GymStatus;
  /** Mensalidade (SaaS) ou manutenção anual/12 (licença), na moeda da academia. */
  monthlyFee: number;
  currency: Currency;
  ownerName: string;
  phone: string;
  startedAt: string; // AAAA-MM-DD
  canceledAt?: string;
  /** Código que o servidor da academia usa para mandar o resumo diário. */
  token: string;
  notes: string;
  // Último resumo enviado pelo servidor da academia (só números, sem dados pessoais)
  students: number;
  activeStudents: number; // treinaram nos últimos 30 dias
  workouts30d: number;
  checkins30d: number;
  lastReportAt?: string; // ISO
}

export type TxType = 'entrada' | 'saida';

export interface Transaction {
  id: string;
  date: string; // AAAA-MM-DD
  type: TxType;
  category: string;
  description: string;
  amount: number; // sempre positivo, na moeda indicada
  currency: Currency;
  country: Country | 'GERAL';
  gymId?: string;
}

export type LeadStage = 'lead' | 'contato' | 'demo' | 'proposta' | 'negociacao' | 'ganho' | 'perdido';

export interface Lead {
  id: string;
  gymName: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  country: Country;
  stage: LeadStage;
  plan: GymPlan;
  /** Valor esperado por mês (SaaS) ou valor da licença, na moeda do país. */
  value: number;
  source: string;
  students: number; // tamanho da academia (alunos)
  nextAction: string;
  nextActionDate?: string;
  lostReason?: string;
  gymId?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export type ActivityKind = 'nota' | 'ligacao' | 'whatsapp' | 'reuniao' | 'demo' | 'proposta' | 'etapa';

export interface LeadActivity {
  id: string;
  leadId: string;
  date: string; // ISO
  kind: ActivityKind;
  text: string;
}

export interface Settings {
  companyName: string;
  /** Quantos guaranis vale 1 real. */
  fxPygPerBrl: number;
  /** Caixa atual (em reais) para calcular quantos meses o dinheiro aguenta. */
  cashBrl: number;
  geminiModel: string;
}

export interface Db {
  gyms: Gym[];
  transactions: Transaction[];
  leads: Lead[];
  activities: LeadActivity[];
  settings: Settings;
}

export type Table = 'gyms' | 'transactions' | 'leads' | 'activities';
export type Row<T extends Table> = T extends 'gyms' ? Gym : T extends 'transactions' ? Transaction : T extends 'leads' ? Lead : LeadActivity;

export const STAGES: { id: LeadStage; label: string; prob: number }[] = [
  { id: 'lead', label: 'Lead', prob: 0.05 },
  { id: 'contato', label: 'Contato feito', prob: 0.15 },
  { id: 'demo', label: 'Demonstração', prob: 0.35 },
  { id: 'proposta', label: 'Proposta', prob: 0.55 },
  { id: 'negociacao', label: 'Negociação', prob: 0.75 },
  { id: 'ganho', label: 'Ganho', prob: 1 },
  { id: 'perdido', label: 'Perdido', prob: 0 },
];

export const INCOME_CATEGORIES = ['Mensalidade SaaS', 'Licença', 'Manutenção anual', 'Implantação', 'Outros'];
export const EXPENSE_CATEGORIES = ['Servidores', 'Domínios', 'Marketing', 'Comissões', 'Impostos', 'Ferramentas', 'Pró-labore', 'Contador', 'Outros'];
export const LEAD_SOURCES = ['Indicação', 'Instagram', 'Meta Ads', 'Google', 'Site', 'Visita', 'WhatsApp', 'Outro'];

export const GYM_STATUS_LABEL: Record<GymStatus, string> = {
  teste: 'Em teste',
  ativa: 'Ativa',
  atrasada: 'Pagamento atrasado',
  cancelada: 'Cancelada',
};
