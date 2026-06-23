# Cronograma-de-Gravacoes — contexto do projeto

> Contexto primário para assistentes de IA (regra `ai-context.mdc`) e para quem implementa ou opera o sistema. Atualize este arquivo ao evoluir o produto.
>
> Visão de produto e pitch para visitantes do repositório: **[README.md](../README.md)**. Setup Supabase, deploy e segurança: guias em `docs/*.md` abaixo.

**Pacote npm:** `gravacoes-treinamento` | **Ano:** 2026

---

## Objetivo

Painel interno para acompanhar o cronograma de gravações de vídeo das funcionalidades do sistema: quem grava cada tópico, quantas sessões já foram concluídas e quantas faltam. Substitui o texto corrido da planilha/chat por dados estruturados, com visão de resumo, calendário mensal e progresso por pessoa. A equipe de coordenação usa o painel para remarcar, marcar como gravado e adiar sessões.

---

## Stack

| Camada | Tecnologia / nota |
|--------|-------------------|
| Front | React 18, Vite 5, TypeScript, CSS em `src/index.css` |
| Back | Node 22, Express 5, `tsx`, `dotenv` |
| Banco | Supabase (PostgreSQL), tabela `public.cronograma_sessions` (`DB_TABLE_PREFIX=cronograma`) |
| Catálogo | `public/data/people.yaml` (não está no Supabase) |
| Seed agenda | `public/data/sessions.yaml` → Supabase na 1ª subida ou reset |
| Tooling | Yarn (classic), Node 22 (`.nvmrc`), `concurrently` no dev |

**Setup Supabase:** `docs/supabase-setup.md`

---

## Portas e URLs (desenvolvimento)

| Serviço | Porta / URL |
|---------|-------------|
| Front (Vite) | http://localhost:3333 — proxy `/api` → backend |
| API (Express) | http://127.0.0.1:3334 |
| Produção (`yarn start`) | API + `dist/` na mesma porta (`PORT`, padrão 3334) |

Variáveis: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (servidor). Opcional no front: `VITE_API_URL`.

---

## Modelo de dados

| Fonte | Papel |
|-------|--------|
| `public/data/people.yaml` | Pessoas e tópicos — versionado no git; `topicOrder` opcional (seed) |
| `public/data/sessions.yaml` | Agenda seed — versionado no git |
| Supabase `sessions` | Estado vivo (status, datas, notas) |
| Supabase `person_preferences` | Ordem de gravacao por pessoa (`topic_order`); override editavel no painel |

**Status:** `scheduled`, `done`, `postponed`. **Fuso:** `America/Sao_Paulo`.

---

## API (resumo)

| Método | Rota | Função |
|--------|------|--------|
| GET | `/api/schedule` | `{ people, sessions }` — sessoes relidas do Supabase a cada request |
| PATCH | `/api/people/:personId/topic-order` | Atualiza ordem de gravacao dos topicos (editor) |
| PATCH | `/api/sessions/:id` | Atualiza sessão no Supabase |
| POST | `/api/sessions/swap-time` | Troca horário entre duas sessões |
| POST | `/api/schedule/reset` | Repõe sessões a partir de `sessions.yaml` |

---

## UI (abas)

1. **Resumo** — totais e tabela por pessoa.
2. **Calendário** — grade mensal, drag-and-drop, adiadas, swap de horário.
3. **Por pessoa** — progresso e checklist por tópico.

---

## Decisões fixas

1. **Sessões no Supabase; pessoas no YAML.**
2. **Seed inicial:** só `sessions.yaml` se tabela vazia (não migra `data/sessions.json`).
3. **Dev:** `yarn dev` — Vite 3333 + API 3334.
4. **Chave `service_role` só no servidor** — nunca no bundle Vite.
5. **Leitura publica; escrita com modo editor** — JWT em `localStorage` apos senha (`docs/seguranca.md`).
6. **Alteracoes em rascunho** — confirmacao em modal antes de `apply-batch`; acoes que voltam ao estado do servidor saem da fila; textos de contagem com plural pt-BR (`1 sessao` / `N sessoes`).
7. **Atualizar** — botao reload no header; **celebracao** ao marcar ultima gravacao de uma pessoa; rate limit login/batch (`server/rateLimit.ts`).
7. **Horarios padrao 14h e 16h** — slot custom via picker.
8. **`base: './'`** no Vite para GitHub Pages / raiz.
9. **`yarn import`** regenera YAMLs do script legado.
10. **`topicOrder`** — ordem de gravacao por pessoa: seed em `people.yaml`; override em Supabase (`cronograma_person_preferences`). Util `getTopicOrder()` / `getOrderedTopics()` em `src/lib/topicOrder.ts` (reexport em `schedule.ts`).

---

## Links

| Tipo | URL |
|------|-----|
| Repositório | (AGX-Software — preencher) |
| Epic / board | [Epic #1](https://github.com/RafaelHDSV/Cronograma-de-Gravacoes/issues/1) · [Project Vieira](https://github.com/users/RafaelHDSV/projects/8/views/1) |
| Documentação | `docs/especificacao.md` (epic/card GitHub), `docs/supabase-setup.md`, `docs/deploy-render.md`, `docs/seguranca.md` |

---

## Fora de escopo (v1)

- Contas individuais / OAuth por usuario.
- `people` / tópicos no Supabase.
- Botão Discord no UI; deep link `?date=`; campo `notes` na UI; status `cancelled`.
- GitHub Pages com API (só estático no workflow atual).

---

*Atualizado jun/2026 — Supabase + Yarn.*
