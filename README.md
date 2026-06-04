# Painel do cronograma de gravações

Painel para acompanhar as gravações de vídeo das funcionalidades do sistema: o que tem hoje, quem grava, quantas já foram e quantas faltam.

## Como funciona

- **`public/data/people.yaml`** — catálogo: pessoas e tópicos (letras a, b, c…).
- **`public/data/sessions.yaml`** — agenda inicial (seed); o estado vivo das sessões fica no **Supabase**.
- **API Express** — leitura e alterações (marcar gravado, remarcar, adiar, reset).

Abas: **Resumo**, **Calendário** e **Por pessoa**.

## Primeira vez (Supabase + env)

Siga o guia completo: **[docs/supabase-setup.md](docs/supabase-setup.md)**

Resumo:

1. Criar projeto no Supabase e rodar o SQL em `supabase/migrations/20260604120000_sessions.sql`
2. Copiar `.env.example` → `.env` com `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
3. `yarn` e `yarn dev` → http://localhost:3333

## Comandos

```bash
yarn          # instalar dependencias
yarn dev      # front :3333 + API :3334
yarn build    # build de producao
yarn start    # API + dist/ (apos build)
yarn import   # regenerar people.yaml e sessions.yaml do script legado
```

## Alterar o cronograma no dia a dia

Use o painel (calendário ou por pessoa). As mudanças persistem no Supabase.

Para **repor a agenda do YAML** (descarta alterações no banco):

- `POST /api/schedule/reset`, ou
- esvaziar a tabela `sessions` no Supabase e reiniciar o servidor (seed automático)

Status de sessão: `scheduled`, `done`, `postponed`.

## Regenerar YAML a partir do texto original

```bash
yarn import
```

## Publicação

A API precisa das variáveis Supabase no host. GitHub Pages sozinho publica só o front estático — para edição no painel, use um host com `yarn build` + `yarn start` (ou equivalente).

Workflow comentado: `.github/workflows/deploy.yml` (usa `yarn` quando reativado).
