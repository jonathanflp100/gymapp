// Supabase Edge Function: recebe os avisos da Stripe e atualiza a academia e o financeiro sozinho.
// Publicar SEM verificação de JWT (a Stripe não manda login): supabase functions deploy stripe-webhook --no-verify-jwt
import { handleStripeEvent, supabaseRestDb, verifyStripeSignature, type StripeEvent } from '../_shared/billing.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');
  const payload = await req.text();
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
  if (!(await verifyStripeSignature(payload, req.headers.get('Stripe-Signature'), secret))) {
    return new Response('assinatura inválida', { status: 400 });
  }
  try {
    const ev = JSON.parse(payload) as StripeEvent;
    const db = supabaseRestDb(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const msg = await handleStripeEvent(ev, db);
    console.log(ev.type, ev.id, msg);
    return new Response(JSON.stringify({ ok: true, msg }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('webhook', (e as Error).message);
    // 500 faz a Stripe tentar de novo mais tarde
    return new Response('erro', { status: 500 });
  }
});
