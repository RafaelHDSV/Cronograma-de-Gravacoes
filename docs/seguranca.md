# Seguranca do Cronograma de Gravacoes

Documento de analise para repositorio **publico** e URL **publica** (ex.: Render), com necessidade de **leitura aberta** e **escrita restrita** a coordenadores.

Decisao registrada apos revisao (jun/2026): **modelo D** — senha de equipe + token no servidor, persistido no **localStorage** do navegador (nao a senha em si).

---

## 1. Objetivo

| Quem | Pode |
|------|------|
| Qualquer visitante | Ver cronograma (resumo, calendario, por pessoa) |
| Editor autenticado | Marcar gravado, adiar, remarcar, trocar horario, confirmar lote no Supabase |

O codigo fonte e publico: **nenhum segredo** no git. Credenciais apenas em variaveis de ambiente no Render.

---

## 2. Ameacas relevantes

| Ameaca | Impacto | Mitigacao |
|--------|---------|-----------|
| Repo publico | Nao expor senhas/tokens no codigo | `.env` no Render; `.gitignore` |
| URL publica | Bots ou curiosos chamando API de escrita | Auth em rotas mutaveis (401) |
| XSS no front | Roubo de token no localStorage | React escapa texto; evitar `dangerouslySetInnerHTML`; token de curta/media duracao |
| Senha vazada | Quem tem senha edita tudo | Rotacionar `EDITOR_PASSWORD`; poucos detentores |
| Token vazado | Mesmo que senha ate expirar | Expiracao JWT; botao Sair apaga localStorage |
| Scraping em massa | Leitura do cronograma | Aceito (dado nao e sigiloso); rate limit futuro opcional |
| `POST /api/schedule/reset` | Apagar agenda | Rota protegida; nao expor na UI publica |

---

## 3. Opcoes avaliadas

### A — Sem autenticacao (estado anterior)

- **Pro:** zero complexidade.
- **Contra:** inaceitavel com URL e repo publicos.

### B — Token estatico no header (`EDIT_API_KEY`)

- **Pro:** simples no Express.
- **Contra:** token no localStorage e equivalente a senha fixa; se vazar do browser, edita ate rotacionar env; UX de colar chave longa.

### C — Cookie HttpOnly apos login (sem localStorage)

- **Pro:** token nao acessivel via JS (melhor ante XSS).
- **Contra:** em deploy unico (mesmo dominio) funciona; usuario pediu **nao redigitar senha** — cookie persiste, mas em alguns cenarios mobile/Safari ou abas anonimas a UX pode falhar; implementacao atual prioriza localStorage a pedido do produto.

### D — Senha + JWT no localStorage (escolhido)

- **Fluxo:** usuario abre "Modo editor" -> informa senha uma vez -> `POST /api/auth/login` -> servidor valida `EDITOR_PASSWORD` -> devolve JWT assinado -> front grava em `localStorage` (`cronograma_editor_token`) -> requests mutaveis enviam `Authorization: Bearer ...`.
- **Pro:** senha digitada uma vez; modo editor permanece entre visitas ate expirar ou Sair.
- **Contra:** token legivel por JS (XSS). Mitigar com higiene de front e HTTPS no Render.

### E — Supabase Auth (usuarios, e-mail, OAuth)

- **Pro:** identidade por pessoa, auditoria.
- **Contra:** custo de configuracao e manutencao; excede necessidade atual de "equipe pequena + senha compartilhada".

### F — GitHub OAuth (somente org AGX-Software)

- **Pro:** sem senha compartilhada.
- **Contra:** depende de contas GitHub; visitantes externos nao editam (pode ser desejavel), mas exige app OAuth e lista de org.

---

## 4. Modelo implementado (D)

```text
[Visitante] --> GET /api/schedule --> leitura OK

[Editor] --> POST /api/auth/login { password }
         <-- { token, expiresAt }
         --> localStorage.cronograma_editor_token

[Editor] --> PATCH/POST mutaveis + Authorization: Bearer <token>
         --> middleware valida JWT (SESSION_SECRET)
         --> Supabase
```

### Variaveis de ambiente (Render)

| Variavel | Uso |
|----------|-----|
| `EDITOR_PASSWORD` | Senha compartilhada da equipe (forte, 16+ caracteres) |
| `SESSION_SECRET` | Assina JWT (string aleatoria 32+ caracteres) |
| `AUTH_DISABLED` | Opcional `true` so em dev local (pula auth) |

Gerar segredo (exemplo local):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Rotas

| Rota | Auth |
|------|------|
| `GET /api/schedule` | Publica |
| `GET /api/auth/me` | Publica (retorna `editor: true/false` conforme token) |
| `POST /api/auth/login` | Publica |
| `POST /api/auth/logout` | Publica (no-op; logout e no cliente) |
| `PATCH /api/sessions/:id` | Editor |
| `POST /api/sessions/swap-time` | Editor |
| `POST /api/sessions/apply-batch` | Editor |
| `POST /api/schedule/reset` | Editor |

### localStorage

| Chave | Conteudo |
|-------|----------|
| `cronograma_editor_token` | JWT emitido pelo servidor |

**Nunca** armazenar a senha em localStorage, sessionStorage ou cookies acessiveis por script.

Ao abrir o app: `GET /api/auth/me` define se a UI de edicao esta ativa (token valido ou `AUTH_DISABLED=true` no servidor).

Com `AUTH_DISABLED=true` no `.env` do **backend**, reinicie `yarn dev`: o front detecta `authDisabled` e libera edicao sem botao "Modo editor".

Botao **Sair do modo editor** remove a chave do localStorage.

Expiracao sugerida do JWT: 30 dias (renovar login apos expirar).

---

## 5. Confirmacao de alteracoes (camada UX)

Mesmo autenticado, mutacoes **nao** vao ao banco imediatamente:

1. Acoes entram em fila global de rascunho.
2. **Confirmar alteracoes** abre modal com diff.
3. Confirmar chama `POST /api/sessions/apply-batch` (com token).

Isso reduz erros de clique e nao substitui auth (ambos se complementam).

---

## 6. Checklist de operacao

- [ ] Definir `EDITOR_PASSWORD` no Render (valor forte).
- [ ] Definir `SESSION_SECRET` unico por ambiente.
- [ ] HTTPS ativo (Render padrao).
- [ ] Comunicar senha por canal privado (nao issue publica).
- [ ] Rotacionar senha se alguem sair da equipe.
- [ ] Revisar periodicamente quem tem a senha.

---

## 7. Evolucoes futuras (se o risco crescer)

1. **Cookie HttpOnly** em paralelo ao Bearer (hibrido).
2. **Supabase Auth** ou **GitHub OAuth** por editor identificado.
3. **Rate limiting** em login e apply-batch.
4. **Log de auditoria** (tabela `session_audit` no Supabase).
5. **2FA** ou senhas por pessoa (vault da equipe).

---

## 8. Referencias no codigo

| Arquivo | Funcao |
|---------|--------|
| `server/auth.ts` | Login, JWT, middleware `requireEditor` |
| `src/lib/authStorage.ts` | Leitura/gravacao do token no localStorage |
| `src/lib/api.ts` | Header Authorization nas mutacoes |
| `src/components/EditorLoginModal.tsx` | Pedir senha uma vez |

Deploy: [deploy-render.md](deploy-render.md) — incluir env vars de seguranca.

---

*Documento para avaliacao e registro da decisao. Implementacao alinhada ao modelo D.*
