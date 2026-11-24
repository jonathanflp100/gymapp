# GymApp · Painel administrativo

Painel só para o dono do GymApp. Mostra o negócio no Brasil e no Paraguai:

- **Visão geral:** academias ativas, receita recorrente (MRR/ARR), lucro, alunos usando o app, retornos do CRM vencidos e o que o assistente encontrou.
- **Academias:** lista com situação (teste, ativa, atrasada, cancelada), mensalidade e uso dos últimos 30 dias. Gera o link de pagamento da Stripe e manda pelo WhatsApp. Também mostra o código que o servidor de cada academia usa para mandar o resumo diário.
- **Financeiro:** entradas e saídas em R$ e Gs. (convertidas para reais), lucro por mês, gastos por categoria e planilha CSV.
- **CRM:** funil Lead → Contato → Demonstração → Proposta → Negociação → Ganho/Perdido. Dá para arrastar os cartões, registrar o histórico, chamar no WhatsApp e transformar o lead em academia.
- **Assistente:** nota de saúde do negócio (0–100) por regras de finanças de SaaS (lucro, crescimento, cancelamentos, caixa, uso e cobrança) e um chat opcional com o Gemini.
- **Valuation e equity:** quanto a empresa vale pelo múltiplo do ARR (cenários conservador, base e otimista), a simulação de 1.000 academias (500 + 500) e uma rodada com investidor (pre/post-money, diluição e tabela de sócios).

Sem Supabase configurado, o painel abre em **modo demonstração**, com dados de exemplo guardados no navegador. Dá para mostrar para investidores e parceiros sem expor nada real.

## Rodar no computador

```bash
cd admin
npm install
npm run dev        # http://localhost:3100
npm test           # testes das contas (métricas, valuation, rodada)
```

## Publicar no Cloudflare (igual ao site)

Workers & Pages → Create → Import a repository → `gymapp`:

| Campo | Valor |
|---|---|
| Project name | `gymapp-admin` |
| Build command | `cd admin && npm ci && npm run build` |
| Deploy command | `cd admin && npx wrangler deploy` |

Sem variáveis, o painel sobe em modo demonstração. Para os dados reais, siga os passos abaixo.

## Ligar o banco de dados (Supabase, plano gratuito)

1. Crie uma conta em supabase.com → **New project** (região São Paulo).
2. **SQL Editor** → New query → cole todo o arquivo `supabase/schema.sql` → **Run**.
3. **Authentication → Users → Add user**: crie o seu usuário com e-mail e senha. Marque "Auto confirm".
4. No SQL Editor, rode (com o seu e-mail):
   ```sql
   insert into admins (email) values ('seu-email@exemplo.com');
   ```
5. **Project Settings → API**: copie a *Project URL* e a chave *anon public*.
6. No Cloudflare, projeto `gymapp-admin` → Settings → **Variables** (de build):
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = chave anon public
7. Clique em **Tentar compilar novamente** (Retry build). O painel passa a pedir login e só aceita os e-mails da tabela `admins`.

A chave *anon* pode ficar no site: sem login de administrador, as regras de segurança (RLS) não deixam ler nem gravar nada. A única coisa liberada é a função `report_metrics`, que só aceita números de uma academia com código válido.

## Resumo diário das academias

O servidor de cada academia (hub) manda, uma vez por dia, só números: alunos, alunos ativos, treinos e check-ins dos últimos 30 dias. Nomes e dados de alunos não saem do servidor.

1. No painel → Academias → abra a academia → copie o `ADMIN_GYM_TOKEN`.
2. No `.env` do servidor da academia:
   ```
   ADMIN_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   ADMIN_SUPABASE_ANON_KEY=sua-chave-anon-publica
   ADMIN_GYM_TOKEN=o-codigo-copiado
   ```
3. `docker compose up -d` para reiniciar. O primeiro resumo chega em cerca de 1 minuto.

No SaaS (`deploy/saas`), coloque URL e chave em `deploy/saas/admin.env` uma vez só e passe o token ao criar a academia:
`ADMIN_GYM_TOKEN=... ./scripts/nova-academia.sh ...`

## Cobrança automática pela Stripe

Com a Stripe ligada, cada academia recebe um link de pagamento da assinatura mensal (R$ 350 no Brasil, Gs. 400.000 no Paraguai). Depois disso tudo é automático:

- pagou → a academia fica **Ativa** e a entrada aparece no **Financeiro**;
- o cartão falhou → fica **Pagamento atrasado**;
- cancelou → fica **Cancelada**.

Taxas da Stripe Brasil: 3,99% + R$ 0,39 por cartão nacional, +2% para cartão estrangeiro e 0,7% do Billing (assinaturas).

**Precisa do Supabase já ligado** (seção acima). Depois:

1. Crie a conta em **stripe.com** (país Brasil, com o seu CPF ou CNPJ e conta bancária em reais). Comece no **modo de teste**.
2. Stripe → **Desenvolvedores → Chaves de API**: copie a **chave secreta** (`sk_test_...`).
3. No computador, dentro da pasta do projeto:
   ```bash
   cd admin
   npx supabase login
   npx supabase link --project-ref SEU_REF          # o REF está na URL do projeto no Supabase
   npx supabase functions deploy stripe-checkout
   npx supabase functions deploy stripe-webhook --no-verify-jwt
   ```
4. Stripe → **Desenvolvedores → Webhooks → Adicionar destino**:
   - URL: `https://SEU_REF.supabase.co/functions/v1/stripe-webhook`
   - Eventos: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`
   - Copie o **segredo de assinatura** (`whsec_...`).
5. Guarde as chaves no Supabase:
   ```bash
   npx supabase secrets set STRIPE_SECRET_KEY=sk_test_... STRIPE_WEBHOOK_SECRET=whsec_...
   ```
   Opcional: `CHECKOUT_RETURN_URL` (página depois do pagamento; padrão `…/pago.html` do site) e `STRIPE_PY_CURRENCY=brl` (cobrar o Paraguai em reais).
6. Teste: Academias → abra uma academia → **Gerar link de pagamento** → pague com o cartão de teste `4242 4242 4242 4242` (qualquer data futura e CVC). A academia vira Ativa e a entrada aparece no Financeiro.
7. Funcionou? Ative a conta na Stripe e troque para as chaves **live** (`sk_live_...` e um novo webhook no modo live) repetindo os passos 4 e 5.

**Paraguai:** o link tenta cobrar em guaranis. Se a conta da Stripe do Brasil não aceitar guarani, ele cobra o valor equivalente em reais pela cotação das Configurações (Gs. 400.000 ≈ R$ 341), e o banco do cliente converte.

Na página `site/public/pago.html`, coloque o seu WhatsApp na variável `WHATSAPP` para aparecer o botão de contato depois do pagamento.

## Assistente com Gemini (opcional)

Em Assistente, cole uma chave criada em aistudio.google.com/apikey. A chave fica só no seu navegador. Para o Google vai apenas um resumo com os números do negócio. Se o Google trocar o nome do modelo, ajuste em Configurações (padrão: `gemini-3.8-flash`).

## Observações

- A cotação (Gs. por R$) e o caixa atual ficam em Configurações.
- O valuation é uma estimativa para orientar conversas, não é laudo. Antes de fechar com investidor, leve a proposta a um advogado societário.
