# Epic: Painel do Cronograma de Gravações

> Especificação de produto e arquitetura para abertura de epic/issue no GitHub. Descreve o que **deve ser construído**, como se o sistema ainda não existisse.
>
> Após a entrega, detalhes operacionais e stack viva ficam em **`docs/context.md`**. Pitch para o repositório: **`README.md`**.

**Versão alvo:** v1.0  
**Data:** 04/06/2026  
**Repositório:** AGX-Software / Cronograma-de-Gravacoes (a confirmar)  
**Uso:** copiar seções ou o documento inteiro no card da epic  
**Referências:** cronograma legado em texto + YAML inicial; migração da v1 estática (YAML + GitHub Pages)

---

## 1. Resumo executivo

Construir um **painel web interno** para coordenar as gravações de vídeo das funcionalidades do sistema. Hoje o cronograma circula como texto longo ou planilha: é difícil saber progresso, remarcar sem erro e dar visibilidade a quem só precisa consultar.

O sistema deve oferecer **uma URL pública** com leitura aberta e **edição restrita** a coordenadores, três visões (resumo, calendário, por pessoa), persistência das sessões em banco (Supabase) e fluxo de alteração com **revisão antes de salvar**.

| Capacidade | Descrição breve |
|------------|-----------------|
| Resumo | Totais, % global, tabela por pessoa |
| Calendário | Mês, drag entre dias, detalhe do dia, adiadas, troca de horário |
| Por pessoa | Progresso e checklist por tópico |
| Horários | Faixas padrão 14h e 16h + horário customizado |
| Confirmação | Fila de rascunho + modal antes de persistir |
| Segurança | Leitura pública; escrita com modo editor (senha + token no navegador) |
| Publicação | Host Node (ex.: Render) com front + API no mesmo serviço |

**Princípios**

- Dados estruturados substituem texto corrido no Discord.
- Quem consulta não precisa de senha; quem edita sim.
- Nenhuma alteração vai ao banco sem passo explícito de confirmação.
- Catálogo de pessoas/tópico versionado no git; estado da agenda no banco.
- Repositório pode ser público sem expor segredos (variáveis no host).

---

## 2. Decisões registradas

| # | Tema | Decisão |
|---|------|---------|
| 1 | Persistência | Sessões no Supabase (PostgreSQL); catálogo `people` + seed `sessions` em YAML no repo |
| 2 | Seed | Agenda inicial em `sessions.yaml`; primeira subida ou reset repõe o banco a partir do YAML |
| 3 | Fuso | `America/Sao_Paulo` para exibição e chaves de dia |
| 4 | Status de sessão | `scheduled`, `done`, `postponed` (sem `cancelled` na v1) |
| 5 | Horários | Padrão 14:00 e 16:00; permitir outro horário sob demanda |
| 6 | Drag no calendário | Mover de dia mantém horário; ajuste de hora é ação explícita no detalhe |
| 7 | Auth v1 | Senha compartilhada da equipe; token JWT no `localStorage` (não armazenar senha no browser) |
| 8 | Leitura | `GET /api/schedule` sem autenticação |
| 9 | Escrita | Rotas de mutação exigem editor autenticado |
| 10 | UX de save | Fila global de pendências + `POST /api/sessions/apply-batch` após modal |
| 11 | Tooling | Yarn; Node 22; React + Vite + Express |
| 12 | Deploy alvo | Render (Web Service); GitHub Pages só estático — insuficiente para API |
| 13 | Documentação segurança | Arquivo `docs/seguranca.md` com opções avaliadas e modelo escolhido |

---

## 3. Visão do produto

### 3.1 Problema

- Dezenas de gravações, várias pessoas, tópicos identificados por letras (a, b, c…).
- Coordenação depende de mensagem longa ou arquivo pouco legível.
- Remarcar, adiar ou marcar “gravado” gera retrabalho e inconsistência.
- URL ou repo públicos exigem separar **ver** de **alterar**, sem bloquear consulta da equipe.

### 3.2 Solução (comportamento esperado)

1. Coordenador abre a URL e vê o cronograma completo (modo leitura).
2. Para editar, entra no **modo editor** com senha da equipe; o navegador guarda o token para não pedir senha a cada visita.
3. Alterações (gravado, adiar, mover dia, trocar horário, reagendar adiada) entram numa **fila pendente** visível no cabeçalho.
4. Ao clicar **Confirmar alterações**, um modal lista cada mudança (antes → depois); confirmar persiste tudo no Supabase de uma vez; cancelar volta ao rascunho.
5. Aba **Resumo** responde “como estamos no geral”; **Calendário** responde “o que é hoje / esta semana”; **Por pessoa** responde “o que falta para fulano”.
6. Link fixo no canal interno (ex.: Discord) aponta para a URL publicada.

### 3.3 Fora do escopo (v1)

- Contas por usuário, OAuth ou perfis individuais.
- Integração Discord (botão copiar resumo) — pode ser v1.1.
- Deep link `?date=` no calendário.
- Status `cancelled`.
- Catálogo de pessoas/tópico editável via UI (permanece YAML no git).
- GitHub Pages como única hospedagem (sem backend).
- Auditoria / histórico de quem alterou o que.

---

## 4. Arquitetura

### 4.1 Visão geral

```text
[Navegador]
    |  leitura: GET /api/schedule (publico)
    |  edicao: POST login -> token localStorage -> mutacoes com Bearer
    v
[Express + React build (dist/)]
    |  people.yaml, sessions.yaml (seed)
    v
[Supabase PostgreSQL — tabela sessions]
```

### 4.2 Stack prevista

| Camada | Tecnologia |
|--------|------------|
| UI | React 18, TypeScript, Vite, CSS (sem lib de componentes obrigatória) |
| API | Node 22, Express 5, dotenv |
| Dados vivos | Supabase (`@supabase/supabase-js`, chave service_role só no servidor) |
| Dados estáticos | `public/data/people.yaml`, `public/data/sessions.yaml` |
| Tooling | Yarn, concurrently (dev), tsx |

### 4.3 Modelo de domínio

```text
Person { id, name, topics[] }          # YAML, raramente alterado
Topic  { letter, title }
Session {
  id, scheduledAt, personId, topicLetter,
  status, notes?, recordedAt?
}                                       # Supabase
```

Regra de negócio **“faltam”:** total de sessões − gravadas − adiadas.

---

## 5. Especificação detalhada

### 5.1 Aba Resumo

**Objetivo:** visão executiva do cronograma.

**Deve exibir**

- Cards: gravadas, faltam, agendadas, adiadas, total.
- Barra de progresso global (%).
- Tabela por pessoa: gravadas / restantes / total / %.

**Critério de aceite**

- [ ] Números refletem sessões exibidas (incluindo rascunho pendente antes de confirmar).
- [ ] Atualiza após confirmar alterações no modal.

---

### 5.2 Aba Calendário

**Objetivo:** operar o dia e a semana.

**Deve permitir (modo editor)**

- Grade mensal com chips por sessão (horário + pessoa).
- Arrastar sessão para outro dia (**mantendo horário**).
- Detalhe do dia selecionado: marcar/desmarcar gravado, adiar, trocar horário com sessão seguinte (↕).
- Botão **Horário** no detalhe: escolha 14:00, 16:00 ou outro (input time).
- Seção **Adiadas:** escolher nova data + horário e reagendar (volta a `scheduled`).
- Atalho **Ir para hoje**.

**Modo leitura**

- [ ] Mesma visualização, sem controles de edição nem drag.

**Critério de aceite**

- [ ] Sessões adiadas não aparecem na grade principal; aparecem na lista de adiadas.
- [ ] Horário customizado persiste em ISO com offset `-03:00`.

---

### 5.3 Aba Por pessoa

**Objetivo:** progresso individual por gravador.

**Deve exibir**

- Lista de pessoas com barra de progresso.
- Ao expandir: tabela de tópicos com data, status e checkbox para marcar gravado (editor).

**Critério de aceite**

- [ ] Tópicos sem sessão agendada aparecem como “—”.
- [ ] Checkbox alimenta a mesma fila pendente global do calendário.

---

### 5.4 Fila de confirmação e modal

**Objetivo:** evitar gravação acidental no banco.

**Fluxo**

1. Toda ação de edição acumula patch por `sessionId` (merge se mesma sessão).
2. Cabeçalho mostra contador “N alteração(ões) pendente(s)” e botões **Descartar** / **Confirmar alterações**.
3. Modal lista cada sessão com resumo legível (antes → depois) e tags das ações (ex.: “Adiar gravação”).
4. Confirmar chama API em lote; sucesso limpa fila e atualiza estado; erro mantém fila.

**Critério de aceite**

- [ ] Nenhum PATCH/POST de mutação individual obrigatório na UI (batch é o caminho principal).
- [ ] Trocar de aba não descarta rascunho até descartar ou confirmar.

---

### 5.5 Modo editor e segurança

**Objetivo:** URL e repo públicos com escrita controlada.

**Deve implementar**

- Documento `docs/seguranca.md` comparando opções (sem auth, API key, cookie, JWT + localStorage, Supabase Auth, OAuth) e registrando decisão.
- `POST /api/auth/login` com senha → JWT; `GET /api/auth/me` para validar token.
- Rotas de mutação protegidas; leitura pública.
- UI: botão **Modo editor**; após login, token em `localStorage`; **Sair do modo editor** remove token.
- Variáveis: `EDITOR_PASSWORD`, `SESSION_SECRET` no host; `AUTH_DISABLED=true` apenas dev local.

**Critério de aceite**

- [ ] Visitante anônimo carrega cronograma sem login.
- [ ] Sem token, botões de edição indisponíveis ou ocultos.
- [ ] Senha nunca persiste em localStorage.

---

### 5.6 Backend e persistência

**Objetivo:** API unificada e estado no Supabase.

**Rotas mínimas**

| Método | Rota | Auth | Função |
|--------|------|------|--------|
| GET | `/api/schedule` | Não | Pessoas (YAML) + sessões (DB) |
| GET | `/api/auth/me` | Não | `{ editor, authDisabled? }` |
| POST | `/api/auth/login` | Não | Emite token |
| POST | `/api/sessions/apply-batch` | Sim | Aplica patches em lote |
| POST | `/api/schedule/reset` | Sim | Repõe sessões do YAML |
| PATCH | `/api/sessions/:id` | Sim | Opcional (compat / ferramentas) |

**Comportamento de dados**

- Na subida: se tabela `sessions` vazia, seed a partir de `sessions.yaml`.
- Leitura de sessões deve refletir o banco (evitar cache em memória desatualizado entre instâncias do servidor).
- Migration SQL versionada em `supabase/migrations/`.

**Critério de aceite**

- [ ] Alteração confirmada no ambiente A aparece no ambiente B após reload (mesmo projeto Supabase).
- [ ] `.env.example` documenta variáveis sem valores reais.

---

### 5.7 Identidade visual

**Objetivo:** painel reconhecível no cabeçalho.

- Logo simples (ícone, ex.: câmera/vídeo) em `public/logo.svg`.
- Exibição ao lado do título “Cronograma de Gravações”; favicon no `index.html`.

**Critério de aceite**

- [ ] Logo visível em dev e em build de produção (`base` relativo para subpath).

---

### 5.8 Publicação e operação

**Objetivo:** URL interna estável para a equipe.

- Guia `docs/deploy-render.md`: Web Service, `yarn build`, `yarn start`, env Supabase + auth.
- Guia `docs/supabase-setup.md`: criar projeto, SQL, `.env`.
- README voltado a produto (vendável); `docs/context.md` para stack e portas.

**Critério de aceite**

- [ ] Deploy no Render serve front e API na mesma origem.
- [ ] Cold start aceito no tier free documentado.

---

### 5.9 Migração da v1 (YAML estático)

**Objetivo:** quem já usava painel só com YAML não perde referência.

- Manter `people.yaml` e `sessions.yaml` no repo como fonte de seed.
- Não migrar `sessions.json` local automaticamente; estado oficial passa a ser o Supabase.
- Script `yarn import` para regenerar YAML a partir do texto legado embutido (opcional, já existente na linha do tempo do repo).

---

## 6. Critérios de aceite gerais da epic

- [ ] Três abas funcionais com dados consistentes entre si.
- [ ] Modo leitura e modo editor conforme seção 5.5.
- [ ] Confirmação em lote obrigatória para persistir edições.
- [ ] Horários 14h/16h + custom conforme seção 5.2.
- [ ] Supabase como única fonte de verdade para status e datas de sessões.
- [ ] Documentação: README (produto), context (técnico), segurança, supabase-setup, deploy-render.
- [ ] Build e start documentados com Yarn.

---

## 7. Fases sugeridas de entrega

| Fase | Entrega | Objetivo |
|------|---------|----------|
| 1 | Modelo + API leitura + seed Supabase | Ver cronograma na URL |
| 2 | Calendário + Por pessoa + Resumo (só leitura) | UX completa sem edição |
| 3 | Modo editor + apply-batch + modal confirmação | Edição segura |
| 4 | Horários flexíveis + adiadas + polish UI | Operação real do dia a dia |
| 5 | docs segurança + deploy Render + README | Publicação e governança |

As fases podem ser issues filhas da epic no GitHub.

---

## 8. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Cache em memória no servidor desalinha ambientes | Ler Supabase no GET ou invalidar cache após batch |
| Token no localStorage (XSS) | Documentar em segurança; higiene de front; HTTPS |
| Senha compartilhada vazada | Rotação via env; poucos detentores |
| Render free hiberna | Documentar cold start; link no canal |
| Limite 2 projetos Supabase free | Reutilizar projeto existente ou doc de setup |

---

## 9. Backlog pós-v1 (não bloqueia a epic)

- Botão copiar resumo do dia para Discord.
- Deep link `?date=YYYY-MM-DD` no calendário.
- Autenticação individual (OAuth / Supabase Auth).
- Histórico de alterações.
- Status `cancelled`.

---

## 10. Relação com outros documentos

| Documento | Quando usar |
|-----------|-------------|
| Este arquivo | Abrir epic / alinhar escopo antes e durante o desenvolvimento |
| `README.md` | Apresentar o projeto no repositório |
| `docs/context.md` | Stack, portas, API — após implementação (manter atualizado) |
| `docs/seguranca.md` | Decisão e operação de auth |
| `docs/supabase-setup.md` | Setup banco |
| `docs/deploy-render.md` | Publicação |

---

*Especificação para card GitHub — descreve o alvo da v1.0, não um snapshot de código já mergeado.*
