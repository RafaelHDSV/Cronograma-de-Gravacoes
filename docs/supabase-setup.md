# Configuracao do Supabase e variaveis de ambiente

Este painel persiste **sessoes de gravacao** no PostgreSQL do Supabase. O catalogo de pessoas e topicos continua em `public/data/people.yaml`; a agenda inicial vem de `public/data/sessions.yaml` (seed na primeira subida ou no reset).

---

## 1. Criar projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com) e faca login.
2. **New project** — escolha organizacao, nome (ex.: `cronograma-gravacoes`), senha do banco e regiao proxima ao time.
3. Aguarde o provisionamento (alguns minutos).

---

## 2. Criar a tabela `sessions`

No painel do projeto: **SQL Editor** -> **New query**.

Cole e execute o conteudo do arquivo:

`supabase/migrations/20260604120000_sessions.sql`

Isso cria a tabela `public.sessions`, indices e habilita RLS (sem policies para usuario anonimo — apenas o backend com **service role** acessa os dados).

Confira em **Table Editor** se a tabela `sessions` aparece vazia.

---

## 3. Obter URL e chave de API

1. **Project Settings** (engrenagem) -> **API**.
2. Copie:
   - **Project URL** -> `SUPABASE_URL`
   - **service_role** (em *Project API keys*) -> `SUPABASE_SERVICE_ROLE_KEY`

> **Importante:** a `service_role` ignora RLS e da acesso total ao banco. Use **somente no servidor** (Express). Nunca coloque essa chave em variaveis `VITE_*` nem commite no git.

A chave `anon` / `publishable` **nao e usada** nesta versao do projeto.

---

## 4. Arquivo `.env` local

Na raiz do repositorio:

```bash
cp .env.example .env
```

Edite `.env`:

```env
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

O arquivo `.env` ja esta no `.gitignore`.

---

## 5. Rodar o painel

```bash
yarn
yarn dev
```

- Front: http://localhost:3333  
- API: http://127.0.0.1:3334 (proxy `/api` no Vite)

Na **primeira subida** com a tabela vazia, o servidor:

1. Le `public/data/sessions.yaml`
2. Insere todas as sessoes no Supabase
3. Log: `[data] Seed: N sessoes de sessions.yaml -> Supabase`

Nas proximas subidas, carrega do Supabase.

---

## 6. Seed e reset

| Acao | Como |
|------|------|
| Agenda inicial no banco | Automatico se `sessions` estiver vazia (fonte: `sessions.yaml`) |
| Repor agenda do YAML | `POST /api/schedule/reset` ou reiniciar apos esvaziar a tabela no SQL Editor |
| Alterar catalogo de pessoas | Editar `people.yaml` e reiniciar o servidor (nao vai para o Supabase) |
| Regenerar YAMLs do texto legado | `yarn import` |

**Decisao de produto:** o estado em `data/sessions.json` local **nao e migrado**. Producao e novos ambientes usam apenas `sessions.yaml` como seed (opcao B da proposta).

---

## 7. Deploy (API com Supabase)

Qualquer host que rode `yarn build` + `yarn start` precisa das mesmas variaveis:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT` (opcional)

Exemplos: Railway, Render, VM, container. Configure as env vars no painel do provedor — nao use arquivo `.env` commitado.

GitHub Pages **so publica o front estatico**; mutacoes exigem o Express com Supabase.

---

## 8. Seguranca (v1 e proximos passos)

- Hoje: sem autenticacao na UI; `POST /api/schedule/reset` permanece aberto (uso interno).
- RLS ligado na tabela sem policy publica reduz exposicao se alguem usar a chave `anon` por engano.
- **Proximo passo planejado:** autenticacao (ex.: Supabase Auth ou token no Express) antes de expor a API na internet.

---

## 9. Problemas comuns

| Sintoma | Causa provavel | Solucao |
|---------|----------------|---------|
| `Defina SUPABASE_URL...` ao subir | `.env` ausente ou incompleto | Copiar `.env.example` e preencher |
| `relation "sessions" does not exist` | Migration nao aplicada | Rodar SQL em `supabase/migrations/` |
| `Falha ao carregar sessoes` | URL/chave erradas ou projeto pausado | Conferir API keys e status do projeto |
| Painel vazio apos seed | YAML sem sessoes | Conferir `public/data/sessions.yaml` |
| Dados antigos do JSON local | `data/sessions.json` ignorado | Usar reset ou editar via UI; estado fica no Supabase |

---

## 10. Referencias no codigo

| Arquivo | Funcao |
|---------|--------|
| `server/supabase.ts` | Cliente Supabase (service role) |
| `server/data.ts` | CRUD, seed YAML, cache em memoria |
| `server/index.ts` | Carrega `dotenv` e rotas REST |
| `.env.example` | Modelo de variaveis |

Documentacao geral: `docs/context.md`, `docs/especificacao.md`.
