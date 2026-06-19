# Publicar o painel no Render

Guia para atualizar (ou criar) o deploy no [Render](https://render.com), partindo da **primeira versao** que lia YAML estatico no repositorio, para a versao atual com **API Express + Supabase**.

**Pre-requisitos:** Supabase configurado — [supabase-setup.md](supabase-setup.md).

---

## O que mudou em relacao a v1 (YAML no Render)

| v1 (YAML) | Versao atual |
|-----------|----------------|
| Front estatico ou build que lia YAML em `public/data/` | Front em `dist/` + API no mesmo processo |
| Alteracoes no cronograma = editar YAML + novo deploy | Alteracoes no painel = Supabase (persistente) |
| Sem banco | Tabela `sessions` no Supabase |
| `people.yaml` / `sessions.yaml` no git | Igual: YAML no git; `sessions.yaml` so **seed** / reset |

O Render continua sendo um bom host: um **Web Service** Node roda `yarn build` + `yarn start` e serve UI e `/api` na mesma URL.

---

## 1. Supabase antes do deploy

1. Tabela `sessions` criada (`supabase/migrations/20260604120000_sessions.sql`).
2. Se apareceu erro de RLS antes: rodar `20260604130000_sessions_disable_rls.sql`.
3. Anotar `SUPABASE_URL` e **`service_role`** (nao anon).

Na **primeira subida** em producao com tabela vazia, o servidor faz **seed automatico** a partir de `public/data/sessions.yaml` (mesmo conteudo que a v1 usava no git).

---

## 2. Atualizar o servico existente no Render

Se ja existe um servico da v1:

1. Dashboard Render -> abra o servico do cronograma.
2. Confirme o tipo:
   - **Web Service** (Node) — correto para esta versao.
   - Se for **Static Site** da v1, crie um **novo Web Service** apontando para o mesmo repo (Static Site nao roda a API).

### Repositorio

- **Repository:** este repo (GitHub/GitLab conectado).
- **Branch:** `main` (ou a branch de producao).
- **Root Directory:** vazio (raiz do repo).

### Build e start

| Campo | Valor |
|-------|--------|
| **Runtime** | Node |
| **Build Command** | `yarn install --frozen-lockfile && yarn build` |
| **Start Command** | `yarn start` |

Versoes antigas com `npm` devem trocar para **yarn** (o repo tem `yarn.lock`, sem `package-lock.json`).

### Variaveis de ambiente

Em **Environment** -> **Add Environment Variable**:

| Key | Valor | Observacao |
|-----|--------|------------|
| `SUPABASE_URL` | `https://xxxx.supabase.co` | Project Settings -> API |
| `SUPABASE_SERVICE_ROLE_KEY` | JWT longo (`eyJ...`) | Chave **service_role** (secret) |
| `NODE_ENV` | `production` | Recomendado |
| `EDITOR_PASSWORD` | senha forte da equipe | Modo editor (ver [seguranca.md](seguranca.md)) |
| `SESSION_SECRET` | string aleatoria 32+ chars | Assina token do editor |

O Render define **`PORT`** e **`RENDER=true`** automaticamente — nao precisa criar `PORT` manualmente.

> Nunca commite `.env`. Nao use prefixo `VITE_` na chave do Supabase.

### Health check (recomendado)

- **Health Check Path:** `/api/health` (leve; nao consulta o Supabase).

---

## Cold start (tela de carregamento do Render)

No plano **Free**, o servico **hiberna** apos ~15 minutos sem trafego. A primeira visita do dia pode demorar **30s a 3 min** na tela de carregamento do Render antes do painel abrir.

### Solucoes (da mais simples a mais robusta)

| Opcao | Custo | Efeito |
|-------|--------|--------|
| **Plano Starter no Render** | ~US$ 7/mes | Servico sempre ligado — elimina cold start |
| **Keep-alive no GitHub Actions** | Gratis | Ping a cada 10 min em horario comercial (seg-sex 8h-20h BRT) — evita hibernacao no expediente |
| **Boot mais rapido** (ja no repo) | Gratis | Servidor compilado (`node dist-server`) + `/api/health` antes do Supabase |
| **Retry no front** (ja no repo) | Gratis | Se a pagina abrir antes da API, tenta de novo automaticamente |

### Configurar keep-alive (recomendado no Free)

1. GitHub -> repositorio -> **Settings** -> **Secrets and variables** -> **Actions**.
2. **New repository secret:** `RENDER_APP_URL` = URL publica (ex.: `https://seu-servico.onrender.com`, sem barra no final).
3. O workflow `.github/workflows/keep-render-awake.yml` roda so em dias uteis no horario comercial.
4. Fora desse horario o servico pode hibernar — primeira visita da manha ainda pode demorar um pouco.

Para testar manualmente: **Actions** -> **Keep Render awake** -> **Run workflow**.

### Health check (opcional)

### Deploy

- **Save Changes** -> **Manual Deploy** -> **Deploy latest commit** (ou aguarde auto-deploy no push).

Logs esperados apos sucesso:

```text
[data] Seed: N sessoes de sessions.yaml -> Supabase
```
ou
```text
[data] Carregadas N sessoes do Supabase
[server] Running on http://0.0.0.0:XXXX
```

Abra a URL publica do Render (ex.: `https://seu-servico.onrender.com`).

---

## 3. Criar servico do zero (se nao houver Web Service)

1. **New +** -> **Web Service**.
2. Conecte o repositorio.
3. Preencha Build / Start e env vars como na secao 2.
4. Plano **Free** funciona para uso interno; configure o keep-alive (secao **Cold start**) ou aceite cold start fora do horario comercial.

---

## 4. Fluxo de trabalho apos publicado

### Mudar agenda no dia a dia

Use o painel na URL do Render (marcar gravado, adiar, remarcar). Dados ficam no **Supabase**, nao exigem redeploy.

### Mudar catalogo de pessoas ou agenda base no git

1. Edite `public/data/people.yaml` e/ou `public/data/sessions.yaml`.
2. Commit + push -> Render faz redeploy.
3. **Pessoas:** reinicio do servico ja le o YAML novo.
4. **Sessoes:** o banco **nao** e sobrescrito so com deploy. Para alinhar o banco ao YAML:
   - chamar `POST https://sua-url.onrender.com/api/schedule/reset`, ou
   - esvaziar `sessions` no Supabase e reiniciar o servico (seed de novo).

### Regenerar YAML do legado

Local: `yarn import` -> commit dos YAMLs -> push.

---

## 5. Migracao mental desde a v1 YAML

1. O que estava em **`sessions.yaml` no git** vira seed na primeira carga no Supabase (se a tabela estiver vazia).
2. Estado que existia **so no navegador** ou em arquivo local antigo (`data/sessions.json`) **nao** sobe automaticamente — alinhe via painel ou `reset` + YAML atualizado no repo.
3. Compartilhe a **URL do Render** no canal de coordenacao (como na v1).
4. Supabase e Render free podem **pausar** por inatividade; acesse periodicamente ou aceite cold start.

---

## 6. Problemas comuns no Render

| Sintoma | Causa | Acao |
|---------|--------|------|
| Build falha `yarn: not found` | Imagem sem Yarn | Build Command com `corepack enable && corepack prepare yarn@stable --activate` antes do yarn, ou use Node 22 no Render |
| App sobe e cai no boot | Supabase / chave errada | Ver logs; conferir [supabase-setup.md](supabase-setup.md) |
| Pagina carrega, API falha | `service_role` ou tabela ausente | Env vars + SQL migrations |
| 502 / timeout no cold start | Plano free hibernou | Keep-alive, plano Starter, ou aguardar retry do front |
| Site abre, lista vazia | Seed nao rodou ou banco vazio | Logs de seed; conferir `sessions.yaml` |

Logs: Render -> servico -> **Logs** (build e runtime).

---

## 7. Seguranca (v1 publicada na internet)

- A API esta exposta na URL do Render **sem login** (igual decisao da v1 interna).
- `POST /api/schedule/reset` tambem esta aberto — evite divulgar a URL publicamente se isso for problema.
- **Proximo passo:** autenticacao antes de expor amplamente.

---

## 8. Referencia rapida de comandos locais

```bash
yarn
yarn dev          # desenvolvimento
yarn build        # igual ao Render
yarn start        # igual ao Render (com .env local)
```

Documentacao relacionada:

- [supabase-setup.md](supabase-setup.md) — banco e `.env`
- [context.md](context.md) — visao geral do projeto
- [especificacao.md](especificacao.md) — produto e API

---

*Atualizado para stack Yarn + Express + Supabase.*
