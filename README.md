# GymApp — app white-label para academias

App (PWA) com a marca de cada academia. Português (Brasil) e espanhol (Paraguai).
Funciona de dois jeitos:

| Modo | Para quê | Dados |
|---|---|---|
| **Demo** (padrão) | Mostrar para clientes, Cloudflare Pages | Exemplo, sem servidor |
| **Completo** (`VITE_BACKEND=opengym`) | Uso real na academia | Contas e treinos salvos no servidor **openGym** |

---

## Versão completa (GymApp + servidor openGym)

O app fica com a marca da academia, e o openGym guarda as contas e os treinos.
Os dados ficam no formato do openGym, então a mesma conta também abre no app oficial dele.

### Opção A: com Docker (recomendado)

Precisa do [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e aberto.

```bash
docker compose up -d --build
```

Abra **http://localhost:8080**, toque em **Criar conta** e pronto.

- Marca do Paraguai (Gimnasio Titán, espanhol):
  - PowerShell: `$env:BRAND="titan"; docker compose up -d --build`
  - Linux/Mac: `BRAND=titan docker compose up -d --build`
- Parar: `docker compose down`
- Os dados ficam na pasta `data/`. **Faça backup dela.**

A primeira subida demora alguns minutos (compila o openGym v1.4.4 a partir do código oficial).

### Opção B: sem Docker (Node 22)

Terminal 1, servidor openGym:

```powershell
git clone --branch v1.4.4 --depth 1 https://github.com/DuarteSantos8/openGym
cd openGym\api
npm install --omit=optional
$env:PORT="3001"; $env:DATA_DIR="$PWD\..\..\gym-data"; $env:PASSWORD_LOGIN="1"; $env:ORIGIN="http://localhost:3000"
node server.js
```

Terminal 2, o app (na pasta `gymapp`):

```powershell
npm install
$env:VITE_BACKEND="opengym"; $env:VITE_BRAND="titan"; $env:OPENGYM_URL="http://localhost:3001"
npm run dev
```

Abra **http://localhost:3000**.

### Instalar no servidor de uma academia

No servidor (VPS da academia) com Docker, dentro da pasta do projeto, crie um arquivo `.env`:

```env
ORIGIN=https://app.academia.com.br
RP_ID=app.academia.com.br
BRAND=forcaTotal
WEB_PORT=8080
```

Depois `docker compose up -d --build` e aponte o domínio (com HTTPS) para a porta 8080.
Depois de criar a sua conta, coloque `INVITE_ONLY=1` no `.env` para só entrar quem tiver convite.

### O que já funciona no modo completo

- Criar conta e entrar com nome/e-mail e senha (mensagens em português e espanhol)
- Fichas iniciais (A, B e C) criadas na primeira entrada, no idioma do aluno
- Executar treino e salvar no servidor (séries, cargas, volume)
- Histórico, recordes pessoais, mapa muscular e evolução vindos do servidor
- Sessão mantida ao recarregar e sincronização com conflito resolvido (vários aparelhos)

### O que ainda falta

- **Painel do professor** no modo completo: o openGym ainda não tem esse papel (previsto para a v1.4.10).
  Na demo ele continua funcionando com dados de exemplo.
- Biblioteca usa os 40 exercícios do app (o catálogo do openGym tem 5.632; dá para trazer depois).
- Registrar peso corporal pela tela do app.

---

## Demo de vendas

### O que a demo mostra

**Aluno:** treino do dia com sequência, execução do treino com timer e cargas anteriores,
guia de cada exercício (vídeo, passo a passo, dica e erro comum), **aulas coletivas** com
reserva de vaga, evolução de cargas e recordes, mapa muscular, **avaliação física** com
gráfico de % de gordura e medidas, histórico e WhatsApp da academia.

**Professor:** painel com alunos e aulas do dia, **ficha completa do aluno** (resumo,
frequência semanal, fichas atribuídas, avaliação física, treinos), criação de fichas,
**grade de aulas** com lotação, lista de presença e criação de aulas, e biblioteca de
exercícios com guia de execução.

> Aulas e avaliações ficam salvas no aparelho (dados de exemplo) nos dois modos. No modo
> completo, só treinos, fichas e pesagens vão para o servidor openGym.

```bash
npm install
npm run dev
```

Abre em http://localhost:3000

- Abra `/demo` (ou `?demo=1`) para o painel white-label.
- Troque entre **Força Total** (Brasil, pt-BR) e **Gimnasio Titán** (Paraguai, es-PY).
- Mude nome, slogan, cores e WhatsApp ao vivo, na frente do cliente.
- "Usar como Professor" mostra o painel do professor.

### Publicar grátis (Cloudflare Pages)

1. Entre em https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Escolha o repositório `gymapp`.
3. Configuração de build:
   - Framework preset: **Vite** (ou "None")
   - Build command: `npm run build`
   - Build output directory: `dist`
4. **Save and Deploy**. Sai um link tipo `gymapp.pages.dev`.

Cada `git push` publica de novo sozinho.

---

## Personalizar uma academia nova

Edite `src/config/brand.ts` e adicione um preset com nome, logo, cores, idioma, WhatsApp e código.

## Estrutura

- `src/config/brand.ts` — identidade de cada academia (presets; `VITE_BRAND` escolhe a padrão)
- `src/i18n/translations.ts` — todos os textos em pt-BR e es-PY
- `src/services/api.ts` — única porta de acesso a dados: escolhe entre demo e servidor real
- `src/services/openGymBackend.ts` — ponte com o openGym (login, leitura e gravação, conversão de formatos)
- `src/data/catalogueMap.ts` — cada exercício do app ligado ao exercício do catálogo openGym
- `src/data/mockData.ts` — dados de demonstração
- `src/data/demoLocaleEs.ts` — tradução dos dados de demonstração para espanhol
- `Dockerfile`, `deploy/nginx.conf`, `docker-compose.yml` — pacote da versão completa

## Licenças

O servidor openGym é AGPL-3.0 (https://github.com/DuarteSantos8/openGym). Este pacote usa o
openGym sem modificações, compilado do código oficial. As imagens de exercício do openGym têm
licença própria e não são usadas pelo GymApp.
