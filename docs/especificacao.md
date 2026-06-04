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
- **Back:** Node 22, Express 5, `js-yaml`, persistência em `data/sessions.json`
- **Dados:** `people.yaml` + `sessions.yaml` em `public/data/`; runtime em JSON local
- **Tooling:** npm, Node 22, `concurrently` / `tsx`

---

## Setup e comandos locais

```bash
npm install
npm run dev      # Vite :3333 + API :3334 (proxy /api)
npm run build    # tsc -b && vite build → dist/
npm start        # API + serve dist/ (produção local, porta PORT ou 3334)
npm run import   # Regenera people.yaml e sessions.yaml a partir do script
```

Scripts auxiliares: `npm run dev:front`, `npm run dev:back`, `npm run preview`.

No Windows, se precisar alinhar Node via nvm: `scripts/loadNvmAndNode.ps1`.

---

## Funcionalidades entregues

### Resumo (`SummaryPage`)

- Cards: gravadas, faltam, agendadas, adiadas, total.
- Barra de progresso global (% concluído).
- Tabela de progresso por pessoa (gravadas / restantes / total / %).

### Calendário (`CalendarPage`)

- Navegação por mês (intervalo derivado das sessões ativas + hoje).
- Células com chips de sessão (horário + primeiro nome); contador done/total no dia.
- **Arrastar** sessão para outro dia → atualiza `scheduledAt` (mantém horário).
- Painel do dia selecionado: marcar/desmarcar gravado, **Adiar** (`postponed`), **trocar horário** com a sessão seguinte (↕).
- Seção **Adiadas**: escolher nova data e **Agendar** (volta a `scheduled` com nova data).
- Atalho **Ir para hoje**.

### Por pessoa (`PersonPage`)

- Lista com barra de progresso por pessoa; expandir mostra todos os tópicos do catálogo.
- Checkbox por sessão existente para alternar `scheduled` ↔ `done` (data de gravação = dia atual ao marcar).

### Cabeçalho (`App`)

- Contadores resumidos e abas: Resumo | Calendário | Por pessoa.

---

## Modelo de domínio

```text
Person { id, name, topics[] }
Topic  { letter, title }
Session { id, scheduledAt, personId, topicLetter, status, notes?, recordedAt? }
```

- `scheduledAt` em ISO com offset (ex.: `-03:00`).
- Título do tópico é resolvido via `people` + `topicLetter`, não fica duplicado na sessão.
- **Regra de “faltam”:** total − gravadas − adiadas (adiadas não contam como pendentes no mesmo sentido que agendadas).

---

## API REST

Base: mesma origem em produção (`npm start`); em dev, proxy Vite → `127.0.0.1:3334`.

| Método | Rota | Body / resposta |
|--------|------|-----------------|
| GET | `/api/schedule` | `{ people, sessions }` |
| PATCH | `/api/sessions/:id` | Body: `{ status?, scheduledAt?, recordedAt? }` → `{ session }` |
| POST | `/api/sessions/swap-time` | `{ sessionIdA, sessionIdB }` → `{ sessions: [a, b] }` |
| POST | `/api/schedule/reset` | Recria `sessions.json` a partir de `sessions.yaml` → `{ people, sessions }` |

Erros: 404 sessão não encontrada; 400 em swap sem ids.

---

## Fluxos operacionais

### Dia a dia (recomendado)

1. Subir `npm run dev` ou ambiente com API.
2. Usar **Calendário** ou **Por pessoa** para marcar gravado, adiar ou remarcar.
3. Estado persiste em `data/sessions.json` no servidor.

### Reset / reimportar agenda base

- **Reset via API:** `POST /api/schedule/reset` (descarta alterações locais e volta ao YAML).
- **Regenerar YAML:** editar texto em `scripts/import-initial-schedule.ts` e rodar `npm run import`; depois reset ou apagar `data/sessions.json` e reiniciar o servidor.

### Imprevistos cobertos pela UI

| Situação | Ação no painel |
|----------|----------------|
| Gravação feita | Checkbox no calendário ou por pessoa → `done` + `recordedAt` (dia atual) |
| Mudar dia mantendo horário | Arrastar no calendário ou reagendar adiada com date picker |
| Trocar ordem no mesmo dia | Botão ↕ entre duas sessões consecutivas |
| Adiar sem data nova | **Adiar** → lista de adiadas |
| Voltar da adiada | Nova data + **Agendar** |

Edição manual de `sessions.yaml` continua válida para mudanças em lote ou CI; após alterar o YAML, usar reset ou reiniciar sem `sessions.json` para reaplicar o seed.

---

## Publicação

| Modo | O que funciona |
|------|----------------|
| `npm run build` + `npm start` | Front + API + persistência JSON — **completo** |
| GitHub Actions (`.github/workflows/deploy.yml`) | Só artefato `dist/` em Pages — **leitura/edição via API não disponível** sem backend adicional |

Para URL interna estável com edição: hospedar Node (VM, Railway, Render, etc.) ou Vercel com server/API; definir `VITE_API_URL` se o front for servido separado.

`vite.config.ts` usa `base: './'` para subpath em Pages.

---

## Decisões registradas

| # | Tema | Decisão |
|---|------|---------|
| 1 | Persistência | JSON local na API; YAML como seed e catálogo versionado |
| 2 | Edição | UI chama API; não exige commit por mudança de status/data |
| 3 | Dev | Dois processos com proxy; produção unificada em Express |
| 4 | Status | Três estados: agendado, gravado, adiado (sem cancelado) |
| 5 | Fuso | America/Sao_Paulo em formatação e chaves de dia |
| 6 | Deploy estático | Pages previsto no workflow; funcionalidade plena exige stack com Node |
| 7 | Import inicial | Script único com texto legado embutido + validações (ids, letras, tópicos) |

---

## Epic / issue GitHub

| Item | Link |
|------|------|
| Epic ou issue principal | (preencher) |
| Board / projeto | (preencher) |

Repositório previsto na org **AGX-Software** (ver `README.md`).

---

## Fora de escopo

- Autenticação e controle de acesso por papel.
- Histórico de alterações / audit log.
- Integração Discord no UI (helper `buildDaySummary` preparado, não exposto).
- Status cancelado e relatórios exportáveis (PDF/Excel).
- Sincronização automática com calendário externo (Google Calendar, etc.).
- Banco relacional ou multi-instância sem arquivo compartilhado.

---

## Backlog implícito (código já parcial ou doc antiga)

- [ ] Botão copiar resumo do dia para Discord (`src/lib/discord.ts`).
- [ ] Query `?date=YYYY-MM-DD` no calendário.
- [ ] Alinhar deploy GitHub Pages vs necessidade de API em produção.
- [ ] Atualizar `README.md` (abas, fluxo API vs só YAML).

---

## Relação com outros docs

| Arquivo | Uso |
|---------|-----|
| `docs/context.md` | Stack, portas, API resumida, decisões fixas — contexto primário para IA |
| Este arquivo | Objetivo, funcionalidades, fluxos, API, deploy, escopo |
| `README.md` | Guia operacional rápido (parcialmente desatualizado em relação ao código) |

---

*Atualizado com base no código em jun/2026. Epics no board Vieira usam `especificacao-cards.mdc` — fluxo separado.*
