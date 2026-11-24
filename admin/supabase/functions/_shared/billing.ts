// Cobrança das academias pela Stripe (assinatura mensal), sem SDK: só fetch e Web Crypto.
// Este arquivo roda no Supabase (Deno) e também nos testes (Node), por isso não usa nada específico de nenhum dos dois.

export interface BillingGym {
  id: string;
  name: string;
  country: 'BR' | 'PY';
  currency: 'BRL' | 'PYG';
  monthlyFee: number;
  status: string;
  ownerName?: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}

// Moedas sem centavos na Stripe (o guarani é uma delas): o valor vai inteiro.
const ZERO_DECIMAL = new Set(['pyg', 'jpy', 'krw', 'clp', 'vnd', 'xof', 'xaf', 'ugx', 'rwf', 'kmf', 'gnf', 'djf', 'bif', 'mga', 'vuv', 'xpf']);
export const toMinor = (amount: number, currency: string) => (ZERO_DECIMAL.has(currency.toLowerCase()) ? Math.round(amount) : Math.round(amount * 100));
export const fromMinor = (amount: number, currency: string) => (ZERO_DECIMAL.has(currency.toLowerCase()) ? amount : amount / 100);

/** Transforma um objeto em formulário no formato da Stripe: a[b][0][c]=1 */
export function toForm(obj: Record<string, unknown>, prefix = '', out = new URLSearchParams()): URLSearchParams {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((item, i) => (typeof item === 'object' ? toForm(item as Record<string, unknown>, `${key}[${i}]`, out) : out.append(`${key}[${i}]`, String(item))));
    else if (typeof v === 'object') toForm(v as Record<string, unknown>, key, out);
    else out.append(key, String(v));
  }
  return out;
}

export async function stripeApi<T = Record<string, unknown>>(secretKey: string, path: string, params?: Record<string, unknown>, fetchImpl: typeof fetch = fetch): Promise<T> {
  const res = await fetchImpl(`https://api.stripe.com/v1/${path}`, {
    method: params ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params ? toForm(params).toString() : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(data?.error?.message || `Stripe respondeu ${res.status}`);
  return data;
}

/** Parâmetros da página de pagamento (Checkout) da assinatura mensal de uma academia. */
export function checkoutParams(
  gym: BillingGym,
  opts: { successUrl: string; cancelUrl: string; customerId?: string; locale?: string; charge?: { currency: string; amount: number } },
) {
  if (!(gym.monthlyFee > 0)) throw new Error('Esta academia não tem mensalidade (licença ou valor zerado).');
  // por padrão cobra na moeda da academia; "charge" troca (ex.: guaranis convertidos para reais)
  const currency = (opts.charge?.currency ?? gym.currency).toLowerCase();
  const amount = opts.charge?.amount ?? gym.monthlyFee;
  return {
    mode: 'subscription',
    customer: opts.customerId,
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    locale: opts.locale ?? (gym.country === 'PY' ? 'es-419' : 'pt-BR'),
    client_reference_id: gym.id,
    metadata: { gym_id: gym.id },
    subscription_data: { metadata: { gym_id: gym.id }, description: `GymApp — ${gym.name}` },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: toMinor(amount, currency),
          recurring: { interval: 'month' },
          product_data: { name: gym.country === 'PY' ? `GymApp — suscripción mensual (${gym.name})` : `GymApp — assinatura mensal (${gym.name})` },
        },
      },
    ],
  };
}

/** A conta da Stripe recusou a moeda? (algumas contas do Brasil só cobram em reais) */
export const isCurrencyError = (e: unknown) => /currenc|moeda/i.test(String((e as Error)?.message ?? e));

/** Guaranis → reais com a cotação do painel, arredondado para cima no centavo. */
export const pygToBrl = (pyg: number, fxPygPerBrl: number) => Math.ceil((pyg / (fxPygPerBrl || 1)) * 100) / 100;

// ------------------------------------------------------------------ assinatura do webhook

const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');

export async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

/** Confere o cabeçalho Stripe-Signature (t=...,v1=...). Recusa assinaturas com mais de 5 minutos. */
export async function verifyStripeSignature(payload: string, header: string | null, secret: string, nowSec = Math.floor(Date.now() / 1000), toleranceSec = 300): Promise<boolean> {
  if (!header || !secret) return false;
  const parts = header.split(',').map((p) => p.trim().split('='));
  const t = Number(parts.find(([k]) => k === 't')?.[1]);
  const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!Number.isFinite(t) || !sigs.length) return false;
  if (Math.abs(nowSec - t) > toleranceSec) return false;
  const expected = await hmacHex(secret, `${t}.${payload}`);
  return sigs.some((s) => s.length === expected.length && timingSafeEqual(s, expected));
}

function timingSafeEqual(a: string, b: string) {
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ------------------------------------------------------------------ o que cada evento muda no banco

export interface BillingDb {
  gymById(id: string): Promise<BillingGym | null>;
  gymByStripe(customerId?: string | null, subscriptionId?: string | null): Promise<BillingGym | null>;
  updateGym(id: string, patch: Record<string, unknown>): Promise<void>;
  /** Grava a entrada uma vez só por fatura (idempotente). Devolve false se já existia. */
  insertPayment(row: { date: string; amount: number; currency: string; country: string; gymId: string; description: string; stripeInvoiceId: string }): Promise<boolean>;
}

type Obj = Record<string, any>;
export interface StripeEvent {
  id: string;
  type: string;
  data: { object: Obj };
}

const today = (sec?: number) => new Date(sec ? sec * 1000 : Date.now()).toISOString().slice(0, 10);

async function findGym(db: BillingDb, o: Obj): Promise<BillingGym | null> {
  const gymId = o?.metadata?.gym_id || o?.subscription_details?.metadata?.gym_id || o?.parent?.subscription_details?.metadata?.gym_id || o?.client_reference_id;
  if (gymId) {
    const g = await db.gymById(gymId);
    if (g) return g;
  }
  const sub = typeof o?.subscription === 'string' ? o.subscription : o?.parent?.subscription_details?.subscription ?? (o?.object === 'subscription' ? o.id : null);
  const cus = typeof o?.customer === 'string' ? o.customer : o?.customer?.id;
  return db.gymByStripe(cus, sub);
}

/** Aplica um evento da Stripe. Devolve uma frase curta do que fez (para o log). */
export async function handleStripeEvent(ev: StripeEvent, db: BillingDb): Promise<string> {
  const o = ev.data?.object ?? {};
  switch (ev.type) {
    case 'checkout.session.completed': {
      const g = await findGym(db, o);
      if (!g) return 'academia não encontrada';
      await db.updateGym(g.id, {
        stripe_customer_id: typeof o.customer === 'string' ? o.customer : g.stripeCustomerId,
        stripe_subscription_id: typeof o.subscription === 'string' ? o.subscription : g.stripeSubscriptionId,
        status: 'ativa',
        canceled_at: null,
      });
      return `assinatura criada: ${g.name}`;
    }
    case 'invoice.paid':
    case 'invoice.payment_succeeded': {
      const g = await findGym(db, o);
      if (!g) return 'academia não encontrada';
      const currency = String(o.currency || g.currency).toUpperCase();
      const paid = fromMinor(Number(o.amount_paid ?? 0), currency);
      if (paid > 0 && o.id) {
        await db.insertPayment({
          date: today(o.status_transitions?.paid_at ?? o.created),
          amount: paid,
          currency: currency === 'PYG' ? 'PYG' : 'BRL',
          country: g.country,
          gymId: g.id,
          description: `Mensalidade (Stripe) — ${g.name}`,
          stripeInvoiceId: o.id,
        });
      }
      if (g.status !== 'ativa') await db.updateGym(g.id, { status: 'ativa', canceled_at: null });
      return `pagamento recebido: ${g.name}`;
    }
    case 'invoice.payment_failed': {
      const g = await findGym(db, o);
      if (!g) return 'academia não encontrada';
      if (g.status !== 'cancelada') await db.updateGym(g.id, { status: 'atrasada' });
      return `pagamento falhou: ${g.name}`;
    }
    case 'customer.subscription.deleted': {
      const g = await findGym(db, o);
      if (!g) return 'academia não encontrada';
      await db.updateGym(g.id, { status: 'cancelada', canceled_at: today(o.canceled_at ?? o.ended_at) });
      return `assinatura cancelada: ${g.name}`;
    }
    default:
      return `ignorado: ${ev.type}`;
  }
}

// ------------------------------------------------------------------ banco via REST do Supabase (chave de serviço)

export function supabaseRestDb(url: string, serviceKey: string, fetchImpl: typeof fetch = fetch): BillingDb {
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };
  const map = (r: Obj): BillingGym => ({
    id: r.id,
    name: r.name,
    country: r.country,
    currency: r.currency,
    monthlyFee: Number(r.monthly_fee),
    status: r.status,
    ownerName: r.owner_name,
    stripeCustomerId: r.stripe_customer_id,
    stripeSubscriptionId: r.stripe_subscription_id,
  });
  const get = async (q: string) => {
    const res = await fetchImpl(`${url}/rest/v1/gyms?${q}&limit=1`, { headers: h });
    if (!res.ok) throw new Error(`gyms ${res.status}`);
    const rows = (await res.json()) as Obj[];
    return rows[0] ? map(rows[0]) : null;
  };
  const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);
  return {
    gymById: (id) => (isUuid(id) ? get(`id=eq.${id}`) : Promise.resolve(null)),
    async gymByStripe(cus, sub) {
      if (sub) {
        const g = await get(`stripe_subscription_id=eq.${encodeURIComponent(sub)}`);
        if (g) return g;
      }
      return cus ? get(`stripe_customer_id=eq.${encodeURIComponent(cus)}`) : null;
    },
    async updateGym(id, patch) {
      const res = await fetchImpl(`${url}/rest/v1/gyms?id=eq.${id}`, { method: 'PATCH', headers: h, body: JSON.stringify(patch) });
      if (!res.ok) throw new Error(`update gym ${res.status}: ${await res.text()}`);
    },
    async insertPayment(p) {
      const res = await fetchImpl(`${url}/rest/v1/transactions?on_conflict=stripe_invoice_id`, {
        method: 'POST',
        headers: { ...h, Prefer: 'resolution=ignore-duplicates,return=representation' },
        body: JSON.stringify({ date: p.date, type: 'entrada', category: 'Mensalidade SaaS', description: p.description, amount: p.amount, currency: p.currency, country: p.country, gym_id: p.gymId, stripe_invoice_id: p.stripeInvoiceId }),
      });
      if (!res.ok) throw new Error(`insert payment ${res.status}: ${await res.text()}`);
      const rows = (await res.json().catch(() => [])) as Obj[];
      return rows.length > 0;
    },
  };
}
