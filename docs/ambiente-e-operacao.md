# Ambiente e operação

> **Para que serve:** como rodar, configurar e publicar Cronograma de Gravações
> **Fonte da verdade:** `package.json`, `.env.example`, scripts de CI/deploy
> **Relacionados:** [context](context.md) · [seguranca](seguranca.md)

## Setup

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
