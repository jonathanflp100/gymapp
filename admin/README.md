# GymApp · Painel administrativo

Painel só para o dono do GymApp. Mostra o negócio no Brasil e no Paraguai:

- **Visão geral:** academias ativas, receita recorrente (MRR/ARR), lucro, alunos usando o app, retornos do CRM vencidos e o que o assistente encontrou.
- **Academias:** lista com situação (teste, ativa, atrasada, cancelada), mensalidade e uso dos últimos 30 dias. Também mostra o código que o servidor de cada academia usa para mandar o resumo diário.
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

## Assistente com Gemini (opcional)

Em Assistente, cole uma chave criada em aistudio.google.com/apikey. A chave fica só no seu navegador. Para o Google vai apenas um resumo com os números do negócio. Se o Google trocar o nome do modelo, ajuste em Configurações (padrão: `gemini-3.8-flash`).

## Observações

- A cotação (Gs. por R$) e o caixa atual ficam em Configurações.
- O valuation é uma estimativa para orientar conversas, não é laudo. Antes de fechar com investidor, leve a proposta a um advogado societário.
