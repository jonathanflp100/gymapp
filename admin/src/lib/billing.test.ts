import test from 'node:test';
import assert from 'node:assert/strict';
import { checkoutParams, fromMinor, isCurrencyError, pygToBrl, handleStripeEvent, hmacHex, toForm, toMinor, verifyStripeSignature, supabaseRestDb, type BillingDb, type BillingGym } from '../../supabase/functions/_shared/billing.ts';

const gymPY: BillingGym = { id: '11111111-1111-1111-1111-111111111111', name: 'Gimnasio Titán', country: 'PY', currency: 'PYG', monthlyFee: 400000, status: 'teste', ownerName: 'Juan' };
const gymBR: BillingGym = { id: '22222222-2222-2222-2222-222222222222', name: 'Força Total', country: 'BR', currency: 'BRL', monthlyFee: 350, status: 'ativa' };

function memDb(gyms: BillingGym[]) {
  const state = { gyms: gyms.map((g) => ({ ...g })), payments: [] as any[], updates: [] as any[] };
  const db: BillingDb = {
    async gymById(id) { return state.gyms.find((g) => g.id === id) ?? null; },
    async gymByStripe(cus, sub) { return state.gyms.find((g) => (sub && g.stripeSubscriptionId === sub) || (cus && g.stripeCustomerId === cus)) ?? null; },
    async updateGym(id, patch) {
      state.updates.push({ id, patch });
      const g = state.gyms.find((x) => x.id === id)!;
      if ('status' in patch) g.status = String(patch.status);
      if (patch.stripe_customer_id) g.stripeCustomerId = String(patch.stripe_customer_id);
      if (patch.stripe_subscription_id) g.stripeSubscriptionId = String(patch.stripe_subscription_id);
    },
    async insertPayment(p) {
      if (state.payments.some((x) => x.stripeInvoiceId === p.stripeInvoiceId)) return false;
      state.payments.push(p);
      return true;
    },
  };
  return { db, state };
}

test('guarani não tem centavos na Stripe; real tem', () => {
  assert.equal(toMinor(400000, 'pyg'), 400000);
  assert.equal(toMinor(350, 'brl'), 35000);
  assert.equal(fromMinor(35000, 'BRL'), 350);
  assert.equal(fromMinor(400000, 'PYG'), 400000);
});

test('formulário no formato da Stripe', () => {
  const f = toForm({ a: 1, b: { c: 'x' }, items: [{ q: 1, p: { r: { i: 'month' } } }], skip: undefined });
  assert.equal(f.toString(), 'a=1&b%5Bc%5D=x&items%5B0%5D%5Bq%5D=1&items%5B0%5D%5Bp%5D%5Br%5D%5Bi%5D=month');
});

test('checkout da assinatura mensal no Paraguai e no Brasil', () => {
  const py = checkoutParams(gymPY, { successUrl: 's', cancelUrl: 'c', customerId: 'cus_1' });
  assert.equal(py.mode, 'subscription');
  assert.equal(py.locale, 'es-419');
  assert.equal(py.line_items[0].price_data.currency, 'pyg');
  assert.equal(py.line_items[0].price_data.unit_amount, 400000);
  assert.equal(py.line_items[0].price_data.recurring.interval, 'month');
  assert.equal(py.metadata.gym_id, gymPY.id);
  assert.equal(py.subscription_data.metadata.gym_id, gymPY.id);
  const br = checkoutParams(gymBR, { successUrl: 's', cancelUrl: 'c' });
  assert.equal(br.locale, 'pt-BR');
  assert.equal(br.line_items[0].price_data.unit_amount, 35000);
  assert.throws(() => checkoutParams({ ...gymBR, monthlyFee: 0 }, { successUrl: 's', cancelUrl: 'c' }));
});

test('assinatura do webhook: aceita a certa, recusa falsa e velha', async () => {
  const secret = 'whsec_teste';
  const payload = '{"id":"evt_1"}';
  const t = 1_800_000_000;
  const sig = await hmacHex(secret, `${t}.${payload}`);
  assert.equal(await verifyStripeSignature(payload, `t=${t},v1=${sig}`, secret, t + 10), true);
  assert.equal(await verifyStripeSignature(payload, `t=${t},v1=deadbeef,v1=${sig}`, secret, t), true);
  assert.equal(await verifyStripeSignature(payload + ' ', `t=${t},v1=${sig}`, secret, t), false);
  assert.equal(await verifyStripeSignature(payload, `t=${t},v1=${sig}`, 'outro', t), false);
  assert.equal(await verifyStripeSignature(payload, `t=${t},v1=${sig}`, secret, t + 3600), false);
  assert.equal(await verifyStripeSignature(payload, null, secret, t), false);
});

test('ciclo completo: paga, renova, atrasa, volta e cancela', async () => {
  const { db, state } = memDb([gymPY, gymBR]);
  let r = await handleStripeEvent({ id: 'e1', type: 'checkout.session.completed', data: { object: { object: 'checkout.session', client_reference_id: gymPY.id, metadata: { gym_id: gymPY.id }, customer: 'cus_9', subscription: 'sub_9' } } }, db);
  assert.match(r, /assinatura criada/);
  assert.equal(state.gyms[0].status, 'ativa');
  assert.equal(state.gyms[0].stripeSubscriptionId, 'sub_9');

  // fatura paga (formato novo da Stripe: parent.subscription_details)
  const invoice = { object: 'invoice', id: 'in_1', customer: 'cus_9', currency: 'pyg', amount_paid: 400000, status_transitions: { paid_at: 1_800_000_000 }, parent: { subscription_details: { subscription: 'sub_9', metadata: { gym_id: gymPY.id } } } };
  r = await handleStripeEvent({ id: 'e2', type: 'invoice.paid', data: { object: invoice } }, db);
  assert.match(r, /pagamento recebido/);
  assert.equal(state.payments.length, 1);
  assert.deepEqual({ ...state.payments[0], date: undefined }, { date: undefined, amount: 400000, currency: 'PYG', country: 'PY', gymId: gymPY.id, description: 'Mensalidade (Stripe) — Gimnasio Titán', stripeInvoiceId: 'in_1' });
  // a Stripe pode mandar o mesmo aviso duas vezes: não duplica
  await handleStripeEvent({ id: 'e2b', type: 'invoice.paid', data: { object: invoice } }, db);
  assert.equal(state.payments.length, 1);

  // falhou o cartão → atrasada (achando pela assinatura, formato antigo)
  await handleStripeEvent({ id: 'e3', type: 'invoice.payment_failed', data: { object: { object: 'invoice', id: 'in_2', customer: 'cus_9', subscription: 'sub_9' } } }, db);
  assert.equal(state.gyms[0].status, 'atrasada');

  // pagou depois → ativa de novo e lança a entrada
  await handleStripeEvent({ id: 'e4', type: 'invoice.paid', data: { object: { ...invoice, id: 'in_2', parent: undefined, subscription: 'sub_9' } } }, db);
  assert.equal(state.gyms[0].status, 'ativa');
  assert.equal(state.payments.length, 2);

  // cancelou → cancelada com data
  await handleStripeEvent({ id: 'e5', type: 'customer.subscription.deleted', data: { object: { object: 'subscription', id: 'sub_9', customer: 'cus_9', canceled_at: 1_800_000_000, metadata: { gym_id: gymPY.id } } } }, db);
  assert.equal(state.gyms[0].status, 'cancelada');
  const last = state.updates[state.updates.length - 1];
  assert.equal(last.patch.canceled_at, new Date(1_800_000_000_000).toISOString().slice(0, 10));

  // academia do Brasil em reais: centavos viram reais
  await handleStripeEvent({ id: 'e6', type: 'invoice.paid', data: { object: { object: 'invoice', id: 'in_br', currency: 'brl', amount_paid: 35000, created: 1_800_000_000, metadata: {}, subscription_details: { metadata: { gym_id: gymBR.id } } } } }, db);
  assert.equal(state.payments[2].amount, 350);
  assert.equal(state.payments[2].currency, 'BRL');

  // evento de academia desconhecida ou tipo que não usamos não quebra
  assert.match(await handleStripeEvent({ id: 'e7', type: 'invoice.paid', data: { object: { customer: 'cus_x' } } }, db), /não encontrada/);
  assert.match(await handleStripeEvent({ id: 'e8', type: 'charge.refunded', data: { object: {} } }, db), /ignorado/);
});

test('banco REST: monta as chamadas certas ao Supabase', async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fake = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    if (url.includes('/transactions')) return new Response('[{"id":"t1"}]', { status: 201 });
    if (init?.method === 'PATCH') return new Response(null, { status: 204 });
    return new Response(JSON.stringify([{ id: gymPY.id, name: 'X', country: 'PY', currency: 'PYG', monthly_fee: '400000', status: 'ativa', stripe_customer_id: 'cus_1', stripe_subscription_id: null }]), { status: 200 });
  }) as typeof fetch;
  const db = supabaseRestDb('https://p.supabase.co', 'svc', fake);
  const g = await db.gymById(gymPY.id);
  assert.equal(g?.monthlyFee, 400000);
  assert.equal(await db.gymById('nao-e-uuid'), null);
  await db.gymByStripe('cus_1', 'sub_1');
  assert.ok(calls.some((c) => c.url.includes('stripe_subscription_id=eq.sub_1')));
  await db.updateGym(gymPY.id, { status: 'atrasada' });
  assert.equal(calls.at(-1)!.init!.method, 'PATCH');
  const inserted = await db.insertPayment({ date: '2026-11-18', amount: 1, currency: 'PYG', country: 'PY', gymId: gymPY.id, description: 'd', stripeInvoiceId: 'in_1' });
  assert.equal(inserted, true);
  const ins = calls.at(-1)!;
  assert.ok(ins.url.endsWith('transactions?on_conflict=stripe_invoice_id'));
  assert.match(String((ins.init!.headers as Record<string, string>).Prefer), /ignore-duplicates/);
  assert.equal(JSON.parse(String(ins.init!.body)).stripe_invoice_id, 'in_1');
  assert.equal((ins.init!.headers as Record<string, string>).Authorization, 'Bearer svc');
});

test('Paraguai cobrado em reais quando a conta não aceita guarani', () => {
  assert.equal(pygToBrl(400000, 1171.36), 341.49);
  const p = checkoutParams(gymPY, { successUrl: 's', cancelUrl: 'c', charge: { currency: 'brl', amount: 341.49 } });
  assert.equal(p.line_items[0].price_data.currency, 'brl');
  assert.equal(p.line_items[0].price_data.unit_amount, 34149);
  assert.equal(p.locale, 'es-419');
  assert.ok(isCurrencyError(new Error('The currency pyg is not supported for your account')));
  assert.ok(!isCurrencyError(new Error('Invalid API Key provided')));
});
