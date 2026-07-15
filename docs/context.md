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
| Supabase `sessions` | Estado vivo (status, datas, notas) — N sessoes por topico permitidas |
| Supabase `person_preferences` | Ordem de gravacao por pessoa (`topic_order`); override editavel no painel |

**Status:** `scheduled`, `done`, `postponed`. **Fuso:** `America/Sao_Paulo`. Um topico pode ter **N sessoes**; o video so conta como concluido quando todas estao `done`.

---

## API (resumo)

| Método | Rota | Função |
|--------|------|--------|
| GET | `/api/schedule` | `{ people, sessions }` — sessoes relidas do Supabase a cada request |
| POST | `/api/sessions` | Cria sessao adicional para topico existente (editor) |
| DELETE | `/api/sessions/:id` | Remove sessao (editor) |
| PATCH | `/api/people/:personId/topic-order` | Atualiza ordem de gravacao dos topicos (editor) |
| PATCH | `/api/sessions/:id` | Atualiza sessão no Supabase |
| POST | `/api/sessions/swap-time` | Troca horário entre duas sessões |
| POST | `/api/schedule/fix-fridays` | Migracao unica de sessoes agendadas em sexta (editor) |
| POST | `/api/schedule/fix-day-capacity` | Legado no-op (lotacao max. 2/dia desativada) |
| POST | `/api/schedule/reset` | Repoe sessoes a partir de `sessions.yaml` |

---

## UI (abas)

1. **Resumo** — totais por **topico** (catalogo) e sessoes como detalhe.
2. **Calendario** — grade mensal, drag-and-drop, adiadas, swap de horario; badge de progresso por topico quando N > 1; notas por sessao.
3. **Por pessoa** — progresso por topico, sub-linhas por sessao, adicionar sessao, indicador de notas.

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
11. **Multi-sessao por topico** — agrupamento em `src/lib/topicSessions.ts`; IDs novos com sufixo `-2`, `-3` se colidir no mesmo slot.
12. **Notas por sessao** — campo `notes` no Supabase; edicao no calendario (painel Alterar sessao, fila de rascunho); leitura para visitantes; indicador com tooltip na aba Por pessoa (`src/lib/sessionNotes.ts`).
13. **Sem gravacoes as sextas** — bloqueio em novo agendamento (sexta); sabado e domingo permitidos manualmente; cascata de migracao usa dias uteis (seg-qui); sessoes `done` em sexta permanecem; util em `shared/scheduleDates.ts`.
14. **Sem limite de sessoes por dia** — conflito so no horario exato (mesmo dia + hora + minuto); 14h e 16h sao atalhos do picker; swap troca os dois horarios em colisao; rota/script `fix-day-capacity` legado retorna vazio; util em `shared/dayCapacityMigration.ts`.

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
- Botão Discord no UI; deep link `?date=`; status `cancelled`.
- GitHub Pages com API (só estático no workflow atual).

---

## Alterações recentes (22–23/06/2026)

- Coloquei uma rota leve de *health* e um ping automático no servidor para o Render não hibernar — o painel abre sem ficar minutos na tela de carregamento.
- Passei a aceitar **várias sessões por tópico** e **notas** em cada gravação. Se não deu para gravar tudo em um dia, a sua próxima gravação pode ser no mesmo tópico. E tudo isso pode ser descrito por meios das notas nas gravações
- No painel, cada pessoa pode **reordenar os próprios tópicos** — não precisa seguir A, B, C na ordem fixa do catálogo.
- Seguindo a regra do Zarco (sem gravações às sextas), **reorganizei os tópicos do cronograma**: os dias de cada pessoa continuam os mesmos; só mudei qual tópico cai em cada slot, já que perdemos as sextas.
- Quem prefere o **texto corrido** em vez do calendário pode **exportar o cronograma atual** pelo botão "Exportar Texto" no topo — sai no mesmo formato que o Zarco enviou o cronograma inicialmente.

---

## Alterações recentes (15/07/2026)

- Removido o teto de **2 sessões por dia**: o calendário aceita 3+ no mesmo dia (ex.: uma pessoa em um tópico e outra em dois). Conflito só no **mesmo horário exato**; 14h/16h seguem como atalho no picker.

*Atualizado 15/07/2026.*
