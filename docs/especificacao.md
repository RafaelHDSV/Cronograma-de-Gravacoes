# Cronograma-de-Gravacoes — especificação do projeto

> Guia de produto e entrega deste repositório. Complementa **`docs/context.md`** (contexto rápido para assistentes de IA).

**Ano:** 2026

---

## Objetivo

Coordenar as gravações de vídeo de treinamento das funcionalidades do sistema: cada pessoa tem um conjunto de tópicos (letras a, b, c…) e cada tópico vira uma **sessão** com data/hora agendada. O painel responde: *o que gravar hoje*, *quem já terminou*, *o que foi adiado* e *como remarcar* sem depender de um texto longo no Discord.

**Público:** equipe interna (coordenação + quem grava). **Resultado esperado:** uma única interface com dados consistentes, atualizável no calendário ou por pessoa, com resumo numérico para acompanhamento do cronograma.

---

## Stack

- **Front:** React 18, Vite 5, TypeScript, CSS customizado (`src/index.css`)
- **Back:** Node 22, Express 5, `js-yaml`, `@supabase/supabase-js`, `dotenv`
- **Banco:** Supabase PostgreSQL — tabela `public.sessions`
- **Catálogo:** `people.yaml` em `public/data/` (arquivo, não Supabase)
- **Seed:** `sessions.yaml` → Supabase quando tabela vazia ou em reset
- **Tooling:** Yarn, Node 22, `concurrently` / `tsx`

**Configuração Supabase:** [docs/supabase-setup.md](supabase-setup.md)

---

## Setup e comandos locais

1. Configurar Supabase e `.env` (ver guia acima).
2. Instalar e rodar:

```bash
yarn
yarn dev      # Vite :3333 + API :3334 (proxy /api)
yarn build    # tsc -b && vite build → dist/
yarn start    # API + serve dist/ (produção local)
yarn import   # Regenera people.yaml e sessions.yaml
```

Scripts auxiliares: `yarn dev:front`, `yarn dev:back`, `yarn preview`.

Windows + nvm: `scripts/loadNvmAndNode.ps1`.

---

## Funcionalidades entregues

### Resumo (`SummaryPage`)

- Cards: gravadas, faltam, agendadas, adiadas, total.
- Barra de progresso global (% concluído).
- Tabela de progresso por pessoa.

### Calendário (`CalendarPage`)

- Grade mensal, drag-and-drop entre dias, detalhe do dia, adiadas, swap de horário (↕), **Ir para hoje**.

### Por pessoa (`PersonPage`)

- Progresso expansível, checklist `scheduled` ↔ `done`.

### Cabeçalho (`App`)

- Contadores e abas: Resumo | Calendário | Por pessoa.

---

## Modelo de domínio

```text
Person { id, name, topics[] }     # YAML
Topic  { letter, title }
Session { id, scheduledAt, personId, topicLetter, status, notes?, recordedAt? }  # Supabase
```

- **“Faltam”:** total − gravadas − adiadas.
- **Fuso:** `America/Sao_Paulo`.

---

## API REST

Produção: `yarn start` (mesma origem). Dev: proxy Vite → `127.0.0.1:3334`.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/schedule` | Pessoas (YAML) + sessões (Supabase) |
| PATCH | `/api/sessions/:id` | Atualiza sessão no Supabase |
| POST | `/api/sessions/swap-time` | Troca `scheduledAt` entre duas sessões |
| POST | `/api/schedule/reset` | Limpa tabela e repõe de `sessions.yaml` |

---

## Fluxos operacionais

### Dia a dia

1. `yarn dev` (com `.env` configurado).
2. Alterar no painel → persiste no Supabase.

### Reset / seed

- Tabela vazia na 1ª subida → seed automático de `sessions.yaml`.
- `POST /api/schedule/reset` → repõe YAML no banco.
- `yarn import` → regenera YAMLs; depois reset se quiser refletir no banco.

**Nota:** `data/sessions.json` local não é usado pelo servidor (decisão: seed só via YAML).

---

## Publicação

| Modo | O que funciona |
|------|----------------|
| `yarn build` + `yarn start` + env Supabase | Completo |
| GitHub Pages (workflow comentado) | Só `dist/` estático — sem API |

Host da API precisa de `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.

---

## Decisões registradas

| # | Tema | Decisão |
|---|------|---------|
| 1 | Persistência | Sessões no Supabase; pessoas em YAML |
| 2 | Seed | `sessions.yaml` se tabela vazia; sem migrar JSON local |
| 3 | Segurança v1 | Sem auth; reset aberto; auth planejada |
| 4 | Chaves | `service_role` só no Express |
| 5 | Tooling | Yarn classic (`yarn`, `yarn dev`) |
| 6 | Status | `scheduled`, `done`, `postponed` |

---

## Fora de escopo

- Auth (próxima versão).
- `people` no Supabase.
- Discord UI, `?date=`, cancelado.

---

## Backlog

- [ ] Autenticação na API/UI.
- [ ] Botão copiar resumo Discord.
- [ ] Deep link `?date=` no calendário.

---

## Relação com outros docs

| Arquivo | Uso |
|---------|-----|
| `docs/context.md` | Contexto IA — stack, portas, decisões |
| `docs/supabase-setup.md` | Criar projeto, SQL, `.env` |
| Este arquivo | Produto, fluxos, API, deploy |
| `README.md` | Início rápido |

---

*Atualizado jun/2026 — Supabase + Yarn.*
