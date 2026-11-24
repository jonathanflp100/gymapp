// Supabase Edge Function: gera o link de pagamento (Stripe Checkout) da assinatura mensal de uma academia.
// Só administradores logados no painel podem chamar.
import { checkoutParams, isCurrencyError, pygToBrl, stripeApi, supabaseRestDb } from '../_shared/billing.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) return json({ error: 'Falta configurar STRIPE_SECRET_KEY no Supabase.' }, 500);

    // quem chamou é administrador?
    const auth = req.headers.get('Authorization') || '';
    const check = await fetch(`${url}/rest/v1/rpc/is_admin`, { method: 'POST', headers: { apikey: anon, Authorization: auth, 'Content-Type': 'application/json' }, body: '{}' });
    if (!check.ok || (await check.json()) !== true) return json({ error: 'Só administradores.' }, 403);

    const { gymId } = await req.json();
    const db = supabaseRestDb(url, service);
    const gym = await db.gymById(String(gymId || ''));
    if (!gym) return json({ error: 'Academia não encontrada.' }, 404);

    let customerId = gym.stripeCustomerId || undefined;
    if (!customerId) {
      const c = await stripeApi<{ id: string }>(stripeKey, 'customers', { name: gym.name, metadata: { gym_id: gym.id } });
      customerId = c.id;
      await db.updateGym(gym.id, { stripe_customer_id: customerId });
    }
    const back = Deno.env.get('CHECKOUT_RETURN_URL') || 'https://gymapp-site.jonathanflp100.workers.dev/pago.html';
    const lang = gym.country === 'PY' ? 'es' : 'pt';
    const base = { customerId, successUrl: `${back}?ok=1&lang=${lang}`, cancelUrl: `${back}?ok=0&lang=${lang}` };
    // Paraguai: tenta cobrar em guaranis; se a conta da Stripe não aceitar a moeda
    // (ou se STRIPE_PY_CURRENCY=brl), cobra o valor equivalente em reais pela cotação do painel.
    const toBrl = async () => {
      const r = await fetch(`${url}/rest/v1/settings?id=eq.1&select=data`, { headers: { apikey: service, Authorization: `Bearer ${service}` } });
      const fx = Number((await r.json())?.[0]?.data?.fxPygPerBrl) || 1171.36;
      return { currency: 'brl', amount: pygToBrl(gym.monthlyFee, fx) };
    };
    const forceBrl = gym.currency === 'PYG' && (Deno.env.get('STRIPE_PY_CURRENCY') || '').toLowerCase() === 'brl';
    let session: { url: string };
    try {
      session = await stripeApi<{ url: string }>(stripeKey, 'checkout/sessions', checkoutParams(gym, { ...base, charge: forceBrl ? await toBrl() : undefined }));
    } catch (e) {
      if (gym.currency !== 'PYG' || forceBrl || !isCurrencyError(e)) throw e;
      session = await stripeApi<{ url: string }>(stripeKey, 'checkout/sessions', checkoutParams(gym, { ...base, charge: await toBrl() }));
    }
    return json({ url: session.url });
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
});
