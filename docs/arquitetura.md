# Arquitetura

> **Para que serve:** estrutura do repositório, ciclo de request e fronteiras de empacotamento/deploy
> **Fonte da verdade:** layout de pastas, entrypoints, `vercel.json` / scripts de build
> **Relacionados:** [context](context.md) · [api](api.md) · [ambiente-e-operacao](ambiente-e-operacao.md)

## Visão

Estrutura do app Cronograma de Gravações: ver pastas `frontend/`, `backend/`, `src/` ou monorepo conforme o repositório.

## Fronteiras

| Fronteira | Nota |
|---|---|
| App vs docs | `docs/` é contrato de living docs (board#7), não runtime |
| Segredos | Só `.env` / painel do provedor — nunca no Git |

Dependências declaradas em `package.json` (amostra): @sentry/react, @vieira/analytics, @vieira/institucional, @rafaelhdsv/keep-alive, @supabase/supabase-js, concurrently, cors, dotenv, express, js-yaml, react, react-dom, @sentry/vite-plugin, @types/cors, @types/express, @types/js-yaml, @types/node, @types/react, @types/react-dom, @vitejs/plugin-react, sharp, tsx, typescript, vite.
