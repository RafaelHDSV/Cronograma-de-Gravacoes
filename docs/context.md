# Cronograma-de-Gravacoes — contexto do projeto

> Contexto primário para assistentes de IA (regra `ai-context.mdc`). Atualize este arquivo ao evoluir o produto.

**Pacote npm:** `gravacoes-treinamento` | **Ano:** 2026

---

## Objetivo

Painel interno para acompanhar o cronograma de gravações de vídeo das funcionalidades do sistema: quem grava cada tópico, quantas sessões já foram concluídas e quantas faltam. Substitui o texto corrido da planilha/chat por dados estruturados, com visão de resumo, calendário mensal e progresso por pessoa. A equipe de coordenação usa o painel para remarcar, marcar como gravado e adiar sessões sem editar YAML manualmente no dia a dia.

---

## Stack

| Camada | Tecnologia / nota |
|--------|-------------------|
| Front | React 18, Vite 5, TypeScript, CSS em `src/index.css` |
| Back | Node 22, Express 5, `tsx` (dev e produção) |
| Dados | YAML versionado (`public/data/`) + JSON de runtime (`data/sessions.json`, gitignored) |
| Banco | N/A — persistência em arquivo local via API |
| Tooling | npm, Node 22 (`.nvmrc`), `concurrently` no dev |

---

## Portas e URLs (desenvolvimento)

| Serviço | Porta / URL |
|---------|-------------|
| Front (Vite) | http://localhost:3333 — proxy `/api` → backend |
| API (Express) | http://127.0.0.1:3334 |
| Produção (`npm start`) | Um processo: API + `dist/` estático na mesma porta (`PORT`, padrão 3334) |

Variável opcional no front: `VITE_API_URL` (prefixo da API quando front e back estão em origens diferentes).

---

## Modelo de dados

| Arquivo | Papel |
|---------|--------|
| `public/data/people.yaml` | Catálogo: pessoas e tópicos (letra + título). Muda raramente; versionado no git. |
| `public/data/sessions.yaml` | Agenda inicial (seed). Usado na primeira subida do servidor ou em `POST /api/schedule/reset`. |
| `data/sessions.json` | Estado vivo das sessões (status, datas, notas). Criado/atualizado pela API; não vai para o git. |

**Status de sessão (implementados):** `scheduled`, `done`, `postponed`. Não há `cancelled` no código.

**Fuso horário de exibição e chaves de dia:** `America/Sao_Paulo`.

---

## API (resumo)

| Método | Rota | Função |
|--------|------|--------|
| GET | `/api/schedule` | Retorna `{ people, sessions }` |
| PATCH | `/api/sessions/:id` | Atualiza `status`, `scheduledAt`, `recordedAt` |
| POST | `/api/sessions/swap-time` | Troca horário entre duas sessões (`sessionIdA`, `sessionIdB`) |
| POST | `/api/schedule/reset` | Recarrega sessões a partir de `sessions.yaml` |

---

## UI (abas atuais)

1. **Resumo** — totais globais, barra de progresso, tabela por pessoa.
2. **Calendário** — grade mensal, arrastar sessão para outro dia, detalhe do dia (marcar gravado, adiar, trocar horário), lista de adiadas com reagendamento.
3. **Por pessoa** — progresso expansível, checklist por tópico.

Cabeçalho exibe contadores: gravadas, faltam, adiadas, total.

---

## Decisões fixas

1. **Fonte de verdade em runtime:** alterações pela UI persistem em `data/sessions.json`; YAML de sessões é seed/reset, não edição contínua em produção.
2. **Dev em dois processos:** `npm run dev` sobe Vite (3333) e API (3334) com proxy.
3. **Produção monolítica:** `npm run build` + `npm start` serve front buildado e API no mesmo servidor.
4. **`base: './'` no Vite** — compatível com GitHub Pages em subpath e deploy na raiz.
5. **Sem autenticação, Docker ou banco** na v1 — painel de uso interno/confiança na rede.
6. **Regenerar YAML do zero:** `npm run import` (`scripts/import-initial-schedule.ts`) a partir do texto embutido no script.

---

## Links

| Tipo | URL |
|------|-----|
| Repositório | (organização `AGX-Software` — preencher URL quando publicado) |
| Epic / board | (preencher quando existir) |
| Documentação | `docs/especificacao.md`, `README.md` |

---

## Fora de escopo (v1 atual)

- Status `cancelled` e fluxo de cancelamento.
- Botão “Copiar resumo” no UI (`src/lib/discord.ts` existe, mas não está ligado à interface).
- Deep link `?date=` na URL do calendário.
- GitHub Pages **somente estático** (workflow atual): não expõe a API; painel interativo exige host Node com `npm start` ou deploy full-stack (ex.: Vercel com função/server, VM, etc.).
- Multiusuário, permissões, histórico de auditoria, notificações automáticas.

---

## Pendências conhecidas (doc ↔ código)

- `README.md` ainda descreve quatro abas (inclui “Hoje” / “Por data”) e edição manual só via YAML; o app tem três abas e API para mutações.
- Workflow `.github/workflows/deploy.yml` publica só `dist/` — alinhar README/deploy com ambiente que rode o Express se a edição no painel for obrigatória em produção.

---

*Atualizado com base no código em jun/2026. Origem: scaffold Vieira CLI.*
