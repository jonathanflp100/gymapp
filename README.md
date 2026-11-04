# GymApp — app white-label para academias

App (PWA) com a marca de cada academia. Português (Brasil) e espanhol (Paraguai).
Esta versão é a **demo de vendas**: roda só com dados de demonstração, sem servidor.

## Rodar no computador

```bash
npm install
npm run dev
```

Abre em http://localhost:3000

## Mostrar para um cliente

- Abra `/demo` (ou `?demo=1`) para o painel white-label.
- Troque entre **Força Total** (Brasil, pt-BR) e **Gimnasio Titán** (Paraguai, es-PY).
- Mude nome, slogan, cores e WhatsApp ao vivo, na frente do cliente.
- "Usar como Professor" mostra o painel do professor.

## Publicar grátis (Cloudflare Pages)

1. Entre em https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Escolha o repositório `gymapp`.
3. Configuração de build:
   - Framework preset: **Vite** (ou "None")
   - Build command: `npm run build`
   - Build output directory: `dist`
4. **Save and Deploy**. Sai um link tipo `gymapp.pages.dev`.

Cada `git push` publica de novo sozinho.

## Personalizar uma academia nova

Edite `src/config/brand.ts` e adicione um preset com nome, logo, cores, idioma, WhatsApp e código.

## Estrutura

- `src/config/brand.ts` — identidade de cada academia (presets)
- `src/i18n/translations.ts` — todos os textos em pt-BR e es-PY
- `src/services/api.ts` — **única porta de acesso a dados**. Hoje usa dados falsos; será trocada pela API real.
- `src/data/mockData.ts` — dados de demonstração
- `src/data/demoLocaleEs.ts` — tradução dos dados de demonstração para a demo em espanhol (sai junto com os mocks)

## Próximos passos

1. Subir o backend (openGym em Docker) e mapear a API.
2. Trocar `src/services/api.ts` pela API real (login, treinos, histórico).
3. Adicionar o papel de professor no backend.
4. Script de instalação de um comando no servidor da academia.
