# GymApp — app com a marca da academia

App (PWA) que o aluno instala no celular, com o nome, a logo e as cores da academia.
Português (Brasil) e espanhol (Paraguai).

## O que o produto faz

**Aluno**
- Treino do dia, sequência de dias, execução com timer de descanso e cargas anteriores
- Fichas montadas pelo professor (chegam sozinhas no app)
- Biblioteca com **mais de 5.600 exercícios** (pt-BR e espanhol), cada um com animação de cadência e passo a passo
- Guia de cada exercício: passo a passo, dica, erro comum e animação própria do movimento
- Check-in pelo **QR code da recepção** (o código muda todo dia), mural de avisos e desafios do mês
- Registro de peso e meta pelo próprio aluno; lembretes (aula de hoje, dias sem treinar, desafio quase completo)
- Aulas coletivas: grade da semana, reserva e cancelamento, vagas restantes
- Evolução: cargas, recordes, mapa muscular, histórico
- Avaliação física: peso, % de gordura, massa magra, medidas, gráfico de evolução
- Ranking do mês (dias treinados) para motivar

**Professor**
- Painel com alunos, aulas de hoje e **alunos sumidos** (com mensagem pronta no WhatsApp)
- Ficha completa do aluno: frequência, fichas, avaliações e treinos
- Criar fichas e atribuir a um ou vários alunos
- Grade de aulas: criar, excluir, lotação e lista de presença
- **Equipamentos da academia**: o dono marca o que a academia tem (barras, halteres, polia, aparelhos, smith, kettlebell, TRX...) e oculta exercícios; a biblioteca e a montagem de fichas mostram só o que dá para fazer lá (com opção de abrir o catálogo completo)
- Registrar avaliações físicas
- Engajamento: publicar avisos, criar desafios com prêmio, ver quem concluiu, presença do dia e dos últimos 7 dias
- **Modo recepção**: QR do check-in em tela cheia para TV ou tablet, com contador ao vivo

**Administrador (dono)**
- Tela de configurações: logo, cores, nome, slogan, WhatsApp, endereço, idioma, com prévia ao vivo
- Equipe: define quem é aluno, professor ou administrador; inativa matrícula
- Divulgação: link, QR code e **cartaz pronto para imprimir** na recepção

## Como funciona por dentro

| Peça | O que guarda | Onde |
|---|---|---|
| **App** (React/Vite) | nada, é a tela | `src/` |
| **openGym** v1.4.4 | contas, senhas e treinos de cada aluno | compilado do código oficial |
| **Servidor da academia** (hub) | marca, equipe, fichas do professor, aulas, avaliações, ranking | `server/hub/server.mjs` (Node, sem dependências) |

O login é do openGym; o hub confere a mesma sessão. Os dados ficam em arquivos na pasta `data/`.

## Três formas de usar

### 1. Demo de vendas (grátis, Cloudflare Pages)

Dados de exemplo, sem servidor. Ideal para mostrar ao cliente.

- Build command `npm run build`, pasta `dist`.
- Abra `/demo` para trocar de academia, cores e idioma ao vivo; alterne entre aluno e professor.
- A engrenagem (como professor) abre as configurações.

### 2. Licença própria (servidor da academia)

Na VPS da academia, com Docker instalado:

```bash
cp .env.example .env      # preencha domínio, nome e um SETUP_CODE seu
docker compose up -d --build
```

Depois: abra o endereço → **Criar conta** → **Perfil → Administrador da academia** → digite o `SETUP_CODE`.
A engrenagem no topo abre as configurações. Coloque HTTPS na frente (Caddy, Nginx Proxy Manager ou Cloudflare).

Custo da academia: uma VPS pequena (ex.: Hostinger KVM 1) e um domínio.

### 3. SaaS (várias academias na sua VPS)

Cada academia fica isolada (dados separados) e ganha seu endereço com HTTPS automático.

```bash
cd deploy/saas
ACME_EMAIL=voce@seudominio.com ./scripts/instalar.sh          # uma vez
./scripts/nova-academia.sh forcatotal app.forcatotal.com.br "Academia Força Total" pt-BR "#DC2626"
./scripts/nova-academia.sh titan titan.seuapp.com "Gimnasio Titán" es-PY "#2563EB"
```

O script mostra o **código de ativação** do dono. Antes, aponte o domínio (registro A) para o IP da VPS.

| Script | Para quê |
|---|---|
| `listar.sh` | academias e status |
| `pausar-academia.sh <apelido>` | mensalidade atrasada: tira do ar, guarda os dados |
| `reativar-academia.sh <apelido>` | volta ao ar |
| `backup.sh` | backup de tudo (agende no cron, guarda 14 dias) |
| `atualizar.sh` | depois de `git pull`: faz backup e atualiza todas |

Uma VPS com 2 vCPU e 8 GB (ex.: Hostinger KVM 2) deve comportar dezenas de academias; meça com
`docker stats` conforme crescer.

## Desenvolvimento

```bash
npm install
npm run dev                         # demo
```

Modo completo local (Node 22), em três terminais:

```bash
# 1. openGym
git clone --branch v1.4.4 --depth 1 https://github.com/DuarteSantos8/openGym && cd openGym/api
npm install --omit=optional
PORT=3001 DATA_DIR=./dados PASSWORD_LOGIN=1 ORIGIN=http://localhost:3000 RP_ID=localhost node server.js

# 2. servidor da academia (na pasta gymapp)
PORT=4001 DATA_DIR=./data/hub OPENGYM_URL=http://localhost:3001 SETUP_CODE=teste123 node server/hub/server.mjs

# 3. app (na pasta gymapp)
VITE_BACKEND=opengym OPENGYM_URL=http://localhost:3001 HUB_URL=http://localhost:4001 npm run dev
```

No PowerShell, use `$env:NOME="valor";` antes de cada comando.

## Estrutura

- `src/services/api.ts`: porta de dados (demo ou servidor)
- `src/services/openGymBackend.ts`: contas e treinos (openGym), ciente do papel do usuário
- `src/services/hub.ts` e `src/services/extrasApi.ts`: servidor da academia (aulas, avaliações, equipe)
- `src/views/teacher/SettingsView.tsx`: configurações da academia
- `src/views/teacher/EngagementView.tsx` e `src/components/engagement/`: avisos, desafios, check-in, peso e lembretes
- `src/services/catalogue.ts` e `public/catalogo/`: biblioteca de exercícios carregada sob demanda
- `server/hub/`: servidor da academia + Dockerfile
- `deploy/nginx.conf`: rotas `/api/hub` → hub, `/api` → openGym
- `deploy/saas/`: Caddy, modelo por academia e scripts

## Licenças

O openGym é AGPL-3.0 (https://github.com/DuarteSantos8/openGym) e é usado sem modificações.
As imagens e animações de exercício do openGym pertencem ao Gym Visual e **não** são usadas
(`EXERCISE_MEDIA=off`); para usá-las comercialmente é preciso licença própria em gymvisual.com.

Os textos do catálogo de exercícios (nomes e passo a passo) vêm do catálogo do openGym e ficam
separados do código, como dados, em `public/catalogo/` (veja `public/catalogo/LICENCA.txt`).
Para regenerar: `node scripts/build-catalogue.mjs <pasta openGym>/catalogue`.
