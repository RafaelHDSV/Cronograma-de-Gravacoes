# API

> **Para que serve:** rotas HTTP, CLI I/O, códigos de erro e contratos
> **Fonte da verdade:** handlers / routers / entrypoints CLI
> **Relacionados:** [arquitetura](arquitetura.md) · [banco-de-dados](banco-de-dados.md) · [seguranca](seguranca.md)

## Convenções

- Prefixo / entrypoint: ver código (`/api`, `/v1`, binário CLI, etc.)
- Auth: ver [seguranca](seguranca.md)

## Superfície

Rotas HTTP deste produto: preferir o código em `backend/` ou functions em `api/`. Preencher a tabela abaixo a partir dos routers.

Dependências declaradas em `package.json` (amostra): @sentry/react, @vieira/analytics, @vieira/institucional, @rafaelhdsv/keep-alive, @supabase/supabase-js, concurrently, cors, dotenv, express, js-yaml, react, react-dom, @sentry/vite-plugin, @types/cors, @types/express, @types/js-yaml, @types/node, @types/react, @types/react-dom, @vitejs/plugin-react, sharp, tsx, typescript, vite.

| Método / comando | Caminho | Auth | Nota |
|---|---|---|---|
| | | | Preencher a partir do código |
