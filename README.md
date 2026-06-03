# Painel do cronograma de gravações

Painel para acompanhar as gravações de vídeo das funcionalidades do sistema: o que tem hoje, quem grava, quantas já foram e quantas faltam. Substitui o "texto gigante" por dados estruturados, fáceis de atualizar quando a ordem das pessoas ou os dias mudarem.

## Como funciona

O painel lê dois arquivos YAML, que são a fonte única de verdade:

- `public/data/people.yaml` — catálogo fixo: cada pessoa e seus tópicos (a, b, c...). Muda raramente.
- `public/data/sessions.yaml` — agenda: uma linha por gravação, com data/hora e situação. É aqui que você mexe nos imprevistos.

A interface tem quatro abas: **Hoje**, **Por data**, **Por pessoa** e **Resumo**.

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:3333`.

## Quando houver um imprevisto

Edite `public/data/sessions.yaml` e faça commit. O deploy atualiza o painel sozinho.

Cada gravação tem um campo `status`:

- `scheduled` — agendada (padrão)
- `done` — já gravada
- `postponed` — adiada
- `cancelled` — cancelada

### Marcar uma gravação como feita

Localize a sessão pela data/pessoa e troque o status. Pode registrar a data real em `recordedAt` se gravou em outro dia:

```yaml
- id: 2026-05-28-16-joao-carlos-a
  scheduledAt: '2026-05-28T16:00:00-03:00'
  personId: joao-carlos
  topicLetter: a
  status: done
  recordedAt: '2026-05-28'
  notes: ''
```

### Remarcar (mudar dia ou horário)

Altere apenas o `scheduledAt`. O catálogo de tópicos não muda.

### Trocar a ordem entre pessoas

Troque os campos `personId` e `topicLetter` entre as duas sessões, ou edite cada `scheduledAt`. O título do tópico é resolvido automaticamente pelo catálogo.

## Regenerar a partir do texto original

O texto inicial (Pessoa x Tópicos + Cronograma) está embutido em `scripts/import-initial-schedule.ts`. Para gerar os YAMLs do zero:

```bash
npm run import
```

O script valida que toda sessão aponta para um tópico existente, que não há letras duplicadas por pessoa e que os ids são únicos.

## Link do dia para o Discord

- O botão "Copiar resumo" gera um texto pronto (dentro do limite de 2000 caracteres).
- A aba "Por data" aceita `?date=2026-06-03` na URL para abrir direto num dia.

## Publicação (URL interna)

Já existe um workflow de GitHub Pages em `.github/workflows/deploy.yml`. Após criar o repositório em `AGX-Software` e habilitar Pages (origem: GitHub Actions), todo push na `main` publica o painel. Cole o link fixo no canal de coordenação.

Alternativa: conectar o repositório à Vercel (build `npm run build`, saída `dist`).
