# Regras de negócio

> **Para que serve:** algoritmos e regras do domínio que a IA não deve reinventar
> **Fonte da verdade:** módulos de domínio no código
> **Relacionados:** [especificacao](especificacao.md) · [api](api.md) · [banco-de-dados](banco-de-dados.md)

## Regras

1. **Sessões no Supabase; pessoas no YAML.**
2. **Seed inicial:** só `sessions.yaml` se tabela vazia (não migra `data/sessions.json`).
3. **Dev:** `yarn dev` — Vite 3333 + API 3334.
4. **Chave `service_role` só no servidor** — nunca no bundle Vite.
5. **Leitura publica; escrita com modo editor** — JWT em `localStorage` apos senha (`docs/seguranca.md`).
6. **Alteracoes em rascunho** — confirmacao em modal antes de `apply-batch`; acoes que voltam ao estado do servidor saem da fila; textos de contagem com plural pt-BR (`1 sessao` / `N sessoes`).
7. **Atualizar** — botao reload no header; **celebracao** ao marcar ultima gravacao de uma pessoa; rate limit login/batch (`server/rateLimit.ts`).
8. **Horarios padrao 14h e 16h** — slot custom via picker.
8. **`base: './'`** no Vite para GitHub Pages / raiz.
9. **`yarn import`** regenera YAMLs do script legado.
10. **`topicOrder`** — ordem de gravacao por pessoa: seed em `people.yaml`; override em Supabase (`cronograma_person_preferences`). Util `getTopicOrder()` / `getOrderedTopics()` em `src/lib/topicOrder.ts` (reexport em `schedule.ts`).
11. **Multi-sessao por topico** — agrupamento em `src/lib/topicSessions.ts`; IDs novos com sufixo `-2`,
