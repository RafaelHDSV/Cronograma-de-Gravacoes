/**
 * Gera os arquivos de dados (public/data/people.yaml e public/data/sessions.yaml)
 * a partir do texto original do cronograma.
 *
 * Rode com: npm run import
 *
 * O texto bruto fica embutido aqui de proposito: e a fonte unica da carga
 * inicial. Depois da primeira geracao, os imprevistos sao tratados editando
 * o sessions.yaml diretamente (ver README).
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dump } from 'js-yaml'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = resolve(__dirname, '..', 'public', 'data')

const YEAR = 2026
const TZ_OFFSET = '-03:00'

// Mapeia o nome exibido no cronograma para um id estavel (slug).
const NAME_TO_ID: Record<string, string> = {
  'João Carlos': 'joao-carlos',
  Janderson: 'janderson',
  Vinicius: 'vinicius',
  Robson: 'robson',
  Vieira: 'vieira',
  Marcus: 'marcus',
  Davi: 'davi',
}

const PEOPLE_TEXT = `
**João Carlos**
a. Cadastro de Masters e Configuração de Aparência (front-end)
b. Autocontratação (auto-x)
c. CRUD de Recursos da AC
d. Configurações especiais de passo
e. Detalhes da Proposta e como é renderizado
f. Simulações (Exibição e conceitos)
g. Análise de Crédito Normal
h. Análise de Crédito com Validacao Humana
i. Departamentos Paralelos (após deploy)
j. Credenciais (configuracao e feature)
k. Agente Certificado (configuracao e feature)
l. Customização da exibição de Documentoscopia/Documentos pós-ajuste de OCR
m. Notificações Web Push
n. Corporação Exclusiva
o. Travamento/Destravamento de Auto-Contratações

**Janderson**
a. Autocontratação (back-end)
b. Criação de Fluxos de AC
c. Consumo de Gateways
d. Inspeção (bkapireqs e bkapireqerrors)
e. Passos especiais de Simulacao
f. Configuração de Campos Filhos
g. Inserção de propostas em parceiros
h. Tratamento de webhook para atualização de propostas
i. Timeout e como lidamos, digital ocean e travas de duplicacao
j. Refazer Simulação
k. Postman APIs
l. Atualização de Steps
m. Middlewares do ProductSelfContract
n. Aplicacao de OverrideFields

**Vinicius**
a. Passo de Upload de Documento
b. S3 Bucket e Segurança com Signed URLs
c. Geração de Contrato Automático Plataforma
d. Envio de Documentos para Terceiros via API
e. Geolocalização no back-end
f. Passo de Liveness
g. Passo de Facematch
h. Documentoscopia
i. Integrações com Onbase
j. Rodobens EGI
k. SignIn / Sign-In / SSO
l. Auth-OIDC (separado do SSO genérico)
m. Importação de Leads
n. Configuração de eventos de Postback

**Robson**
a. Criação de Produto
b. Produto e naturezas
c. Produto CRM
d. Produto de Fornecedor
e. Atualização de Propostas Importação
f. Atualização de Propostas Síncrona/Update
g. Atualização de Propostas via Hook
h. Queries em Proposals
i. Rotinas no Core
j. Rotinas no Nexus
k. Filas no Core
l. Filas no Nexus
m. Precificação
n. CRUD de Status Table / Status base para produtos
o. Catálogo de Produtos e busca de meta-produtos — #1232, #1115
p. Status Lineares
q. Expiração de Status
r. Atribuição de Comissão

**Vieira**
a. Grupos de acesso
b. Permissões de escrita e leitura (agx)
c. Hierarquia de Níveis
d. Criação de usuários e fluxos derivados
e. Antifraude na AC
f. Passo de restrição
g. Sobreescrita de retorno de paths por grupo (CUSTOM PATHS)
h. Usuários Adicionais e Customização do comportamento
i. Lista de Restrição (Blocklist)
j. Importação de Usuários Corporação e Loja
k. API de Criação de Usuários
l. Chat Web
m. Projeto coneXia (Consórcio)
n. Refinanciamento LINE
o. Multi-Factor Authentication (MFA)
p. Controle de Nota Fiscal
q. Tradução i18n
r. Promocao de Seller, Supervisor e Equipes
s. Cadastro Orgânico de Vendedores

**Marcus**
a. Behaviour Score
b. Visualização e ordenação do BHS
c. Pricing BHS (depreciação de risco)
d. Ordenação de fallback entre regras
e. Logs, trava e código único por regra de reprova
f. Bilhetagem BHS
g. Cache do BHS e tratamento de exceção
h. Multiplos celulares na proposta
i. Autopreenchimento de Campos
j. Exportacao de Relatório
k. MultiBancos
l. Mapeamento de Status de reprova e relacao com BHS e Restricao
m. Bank Tools e Hub de Averbadoras
n. Link Semi-Autenticado
o. Follow-Up
p. CHAT

**Davi**
a. Omnichannel
b. Omnichannel sob demanda
c. Configuração de mensagem WhatsApp por produto/master
d. Máquina de estados da AC WhatsApp
e. Distribuição Automática de Ligação CallCenter
f. Comunicação central WhatsApp
g. Integrações com Twilio e Meta
h. OCR
i. RH400
j. WhatsApp Flows
k. Disparos de WhatsApp
l. Mailer
m. SMS
n. URA
o. Campanhas de Mensageria
p. Feature de Gestores
q. Distribuição de Leads Automática
`

const SCHEDULE_TEXT = `
28/05 (Qui)
- 16h — João Carlos (a)

29/05 (Sex)
- 14h — Janderson (a)
- 16h — Vinicius (a)

01/06 (Seg)
- 14h — Robson (a)
- 16h — Marcus (a)

02/06 (Ter)
- 14h — Vieira (a)
- 16h — Davi (a)

03/06 (Qua)
- 14h — João Carlos (b)
- 16h — Janderson (b)

04/06 (Qui)
- 14h — Vinicius (b)
- 16h — Robson (b)

05/06 (Sex)
- 14h — Marcus (b)
- 16h — Vieira (b)

08/06 (Seg)
- 14h — Davi (b)
- 16h — João Carlos (c)

09/06 (Ter)
- 14h — Janderson (c)
- 16h — Vinicius (c)

10/06 (Qua)
- 14h — Robson (c)
- 16h — Marcus (c)

11/06 (Qui)
- 14h — Vieira (c)
- 16h — Davi (c)

12/06 (Sex)
- 14h — João Carlos (d)
- 16h — Janderson (d)

15/06 (Seg)
- 14h — Vinicius (d)
- 16h — Robson (d)

16/06 (Ter)
- 14h — Marcus (d)
- 16h — Vieira (d)

17/06 (Qua)
- 14h — Davi (d)
- 16h — João Carlos (e)

18/06 (Qui)
- 14h — Janderson (e)
- 16h — Vinicius (e)

19/06 (Sex)
- 14h — Robson (e)
- 16h — Marcus (e)

22/06 (Seg)
- 14h — Vieira (e)
- 16h — Davi (e)

23/06 (Ter)
- 14h — João Carlos (f)
- 16h — Janderson (f)

24/06 (Qua)
- 14h — Vinicius (f)
- 16h — Robson (f)

25/06 (Qui)
- 14h — Marcus (f)
- 16h — Vieira (f)

26/06 (Sex)
- 14h — Davi (f)
- 16h — João Carlos (g)

29/06 (Seg)
- 14h — Janderson (g)
- 16h — Vinicius (g)

30/06 (Ter)
- 14h — Robson (g)
- 16h — Marcus (g)

01/07 (Qua)
- 14h — Vieira (g)
- 16h — Davi (g)

02/07 (Qui)
- 14h — João Carlos (h)
- 16h — Janderson (h)

03/07 (Sex)
- 14h — Vinicius (h)
- 16h — Robson (h)

06/07 (Seg)
- 14h — Marcus (h)
- 16h — Vieira (h)

07/07 (Ter)
- 14h — Davi (h)
- 16h — João Carlos (i)

08/07 (Qua)
- 14h — Janderson (i)
- 16h — Vinicius (i)

09/07 (Qui)
- 14h — Robson (i)
- 16h — Marcus (i)

10/07 (Sex)
- 14h — Vieira (i)
- 16h — Davi (i)

13/07 (Seg)
- 14h — João Carlos (j)
- 16h — Janderson (j)

14/07 (Ter)
- 14h — Vinicius (j)
- 16h — Robson (j)

15/07 (Qua)
- 14h — Marcus (j)
- 16h — Vieira (j)

16/07 (Qui)
- 14h — Davi (j)
- 16h — João Carlos (k)

17/07 (Sex)
- 14h — Janderson (k)
- 16h — Vinicius (k)

20/07 (Seg)
- 14h — Robson (k)
- 16h — Marcus (k)

21/07 (Ter)
- 14h — Vieira (k)
- 16h — Davi (k)

22/07 (Qua)
- 14h — João Carlos (l)
- 16h — Janderson (l)

23/07 (Qui)
- 14h — Vinicius (l)
- 16h — Robson (l)

24/07 (Sex)
- 14h — Marcus (l)
- 16h — Vieira (l)

27/07 (Seg)
- 14h — Davi (l)
- 16h — João Carlos (m)

28/07 (Ter)
- 14h — Janderson (m)
- 16h — Vinicius (m)

29/07 (Qua)
- 14h — Robson (m)
- 16h — Marcus (m)

30/07 (Qui)
- 14h — Vieira (m)
- 16h — Davi (m)

31/07 (Sex)
- 14h — João Carlos (n)
- 16h — Janderson (n) [encerra Janderson]

03/08 (Seg)
- 14h — Vinicius (n) [encerra Vinicius]
- 16h — Robson (n)

04/08 (Ter)
- 14h — Marcus (n)
- 16h — Vieira (n)

05/08 (Qua)
- 14h — Davi (n)
- 16h — João Carlos (o) [encerra João Carlos]

06/08 (Qui)
- 14h — Robson (o)
- 16h — Marcus (o)

07/08 (Sex)
- 14h — Vieira (o)
- 16h — Davi (o)

10/08 (Seg)
- 14h — Robson (p)
- 16h — Marcus (p) [encerra Marcus]

11/08 (Ter)
- 14h — Vieira (p)
- 16h — Davi (p)

12/08 (Qua)
- 14h — Robson (q)
- 16h — Vieira (q)

13/08 (Qui)
- 14h — Davi (q) [encerra Davi]
- 16h — Robson (r) [encerra Robson]

14/08 (Sex)
- 14h — Vieira (r)
- 16h — Vieira (s) [encerra Vieira]
`

interface Topic {
  letter: string
  title: string
}
interface Person {
  id: string
  name: string
  topics: Topic[]
}
interface Session {
  id: string
  scheduledAt: string
  personId: string
  topicLetter: string
  status: string
  notes: string
}

function parsePeople(text: string): Person[] {
  const people: Person[] = []
  let current: Person | null = null
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    const header = line.match(/^\*\*(.+)\*\*$/)
    if (header) {
      const name = header[1].trim()
      const id = NAME_TO_ID[name]
      if (!id) throw new Error(`Pessoa sem id mapeado: "${name}"`)
      current = { id, name, topics: [] }
      people.push(current)
      continue
    }
    const topic = line.match(/^([a-z])\.\s+(.+)$/)
    if (topic && current) {
      current.topics.push({ letter: topic[1], title: topic[2].trim() })
    }
  }
  return people
}

function parseSessions(text: string): Session[] {
  const sessions: Session[] = []
  let day: { dd: string; mm: string } | null = null
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    const dateHeader = line.match(/^(\d{2})\/(\d{2})\s*\(/)
    if (dateHeader) {
      day = { dd: dateHeader[1], mm: dateHeader[2] }
      continue
    }
    const session = line.match(/^-\s*(\d{1,2})h\s*[—-]\s*(.+?)\s*\(([a-z])\)\s*(?:\[(.+?)\])?\s*$/)
    if (session && day) {
      const hour = session[1].padStart(2, '0')
      const name = session[2].trim()
      const letter = session[3]
      const notes = session[4] ? session[4].trim() : ''
      const personId = NAME_TO_ID[name]
      if (!personId) throw new Error(`Sessao com pessoa desconhecida: "${name}"`)
      const dateStr = `${YEAR}-${day.mm}-${day.dd}`
      sessions.push({
        id: `${dateStr}-${hour}-${personId}-${letter}`,
        scheduledAt: `${dateStr}T${hour}:00:00${TZ_OFFSET}`,
        personId,
        topicLetter: letter,
        status: 'scheduled',
        notes,
      })
    }
  }
  return sessions
}

function validate(people: Person[], sessions: Session[]): void {
  const errors: string[] = []
  const topicTotal = people.reduce((acc, p) => acc + p.topics.length, 0)

  // Letras duplicadas por pessoa.
  for (const p of people) {
    const seen = new Set<string>()
    for (const t of p.topics) {
      if (seen.has(t.letter)) errors.push(`${p.name}: letra duplicada (${t.letter})`)
      seen.add(t.letter)
    }
  }

  // Cada (pessoa, letra) da agenda existe no catalogo.
  const topicIndex = new Map<string, Set<string>>()
  for (const p of people) topicIndex.set(p.id, new Set(p.topics.map((t) => t.letter)))
  for (const s of sessions) {
    const letters = topicIndex.get(s.personId)
    if (!letters || !letters.has(s.topicLetter)) {
      errors.push(`Sessao ${s.id}: topico (${s.topicLetter}) nao existe em ${s.personId}`)
    }
  }

  // Ids de sessao unicos.
  const ids = new Set<string>()
  for (const s of sessions) {
    if (ids.has(s.id)) errors.push(`Id de sessao duplicado: ${s.id}`)
    ids.add(s.id)
  }

  if (errors.length) {
    console.error('Falhas de validacao:')
    for (const e of errors) console.error(`  - ${e}`)
    throw new Error(`${errors.length} erro(s) de validacao`)
  }

  console.log(`OK: ${people.length} pessoas, ${topicTotal} topicos no catalogo, ${sessions.length} sessoes agendadas.`)
}

function main(): void {
  const people = parsePeople(PEOPLE_TEXT)
  const sessions = parseSessions(SCHEDULE_TEXT)
  validate(people, sessions)

  mkdirSync(dataDir, { recursive: true })
  const yamlOpts = { lineWidth: 200, noRefs: true }
  writeFileSync(resolve(dataDir, 'people.yaml'), dump({ people }, yamlOpts), 'utf8')
  writeFileSync(resolve(dataDir, 'sessions.yaml'), dump({ sessions }, yamlOpts), 'utf8')
  console.log(`Arquivos gerados em ${dataDir}`)
}

main()
