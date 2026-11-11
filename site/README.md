# Site de vendas

Página de vendas do app para academias, com cadastro da academia, tela de boas-vindas
e conexão de domínio próprio. Feito em React + Vite + Tailwind, separado do app.

## Rodar no computador

```
cd site
npm install
npm run dev
```

Abra http://localhost:3000. Para testar o cadastro inteiro sem cobrar nada, use
`http://localhost:3000/cadastro?teste=1`.

## Publicar no Cloudflare (projeto separado da demo)

1. No Cloudflare: **Workers & Pages → Create → Import a repository** e escolha o `gymapp` de novo.
2. Nome do projeto: `gymapp-site`.
3. **Root directory (Advanced settings): `site`**
4. Build command: `npm run build` · Deploy command: `npx wrangler deploy`
5. Em **Settings → Variables and Secrets** (tipo Build), coloque:
   - `VITE_WHATSAPP` = seu número com DDI, só números (ex.: 5587999999999)
   - `VITE_DEMO_URL` = endereço da demo com `/demo` no final
   - `VITE_SUPPORT_EMAIL` = seu e-mail de atendimento
   - `VITE_BASE_DOMAIN` = seu domínio (quando tiver)
   - `VITE_PRODUCT_NAME` = nome do produto (se mudar de "GymApp")
6. Faça um novo deploy para valer.

Preços: em `src/constants.ts`.

## Cadastro e pagamento

Enquanto o servidor de cadastro não está no ar, a página de cadastro mostra
"O cadastro online abre em breve" com o botão do WhatsApp. Ela **nunca** finge que
o cadastro deu certo: as respostas simuladas só existem com `?teste=1`.

Rotas que o servidor de cadastro vai atender:
`GET /api/cadastro/subdominio?nome=` · `POST /api/cadastro` · `GET /api/cadastro/status?id=` ·
`GET /api/dominio/verificar?id=`
