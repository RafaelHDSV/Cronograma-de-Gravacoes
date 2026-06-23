/**
 * Reconstrói o sessions.yaml do zero, aplicando:
 * - Ordem original do cronograma (round-robin, do Discord)
 * - Ordem customizada do Janderson (a, b, l, m, n, f, e, c, d, g, h, i, j, k)
 * - Cascata de sextas (por pessoa: sessão de sexta vai para o próximo dia próprio)
 * - Sem limite duro de 2/dia (soft limit apenas)
 *
 * Uso: node scripts/rebuild-schedule.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { dump } from 'js-yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const YAML_PATH = path.join(__dirname, '..', 'public', 'data', 'sessions.yaml')
const TZ = 'America/Sao_Paulo'

// ─────────────────────────────────────────────
// Definição do cronograma
// ─────────────────────────────────────────────

const PEOPLE_ORDER = ['joao-carlos', 'janderson', 'vinicius', 'robson', 'marcus', 'vieira', 'davi']

// Ordem do round-robin: João Carlos gravou primeiro (isolado em 28/05).
// A partir de 29/05, a rodada começa por Janderson e João Carlos fica por último.
// Isso reproduz o cronograma original do Discord (Janderson a, Vinicius a em 29/05 etc.)
const ROUND_ROBIN_ORDER = ['janderson', 'vinicius', 'robson', 'marcus', 'vieira', 'davi', 'joao-carlos']

const PERSON_NAMES = {
  'joao-carlos': 'João Carlos',
  'janderson': 'Janderson',
  'vinicius': 'Vinicius',
  'robson': 'Robson',
  'marcus': 'Marcus',
  'vieira': 'Vieira',
  'davi': 'Davi',
}

// Ordem dos tópicos por pessoa
// Janderson: ordem customizada confirmada no Discord em 11/06
const TOPIC_ORDERS = {
  'joao-carlos': 'abcdefghijklmno'.split(''),
  'janderson': ['a', 'b', 'l', 'm', 'n', 'f', 'e', 'c', 'd', 'g', 'h', 'i', 'j', 'k'],
  'vinicius': 'abcdefghijklmn'.split(''),
  'robson': 'abcdefghijklmnopqr'.split(''),
  'marcus': 'abcdefghijklmnop'.split(''),
  'vieira': 'abcdefghijklmnopqrs'.split(''),
  'davi': 'abcdefghijklmnopq'.split(''),
}

// Último tópico de cada pessoa (para nota "encerra X")
const ENCERRA = {
  'joao-carlos': 'o',
  'janderson': 'k', // último na ordem customizada
  'vinicius': 'n',
  'robson': 'r',
  'marcus': 'p',
  'vieira': 's',
  'davi': 'q',
}

// ─────────────────────────────────────────────
// Utilitários de data
// ─────────────────────────────────────────────

function dateKey(iso) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(iso))
}

function dayOfWeek(dk) {
  return new Date(dk + 'T12:00:00-03:00').getDay() // 0=Dom, 5=Sex, 6=Sáb
}

function isFriday(dk) { return dayOfWeek(dk) === 5 }
function isWeekend(dk) { const d = dayOfWeek(dk); return d === 0 || d === 6 }

function addDays(dk, n) {
  const d = new Date(dk + 'T12:00:00-03:00')
  d.setUTCDate(d.getUTCDate() + n)
  return dateKey(d.toISOString())
}

// Próximo dia Mon-Qui (sem sextas) após o dado
function nextMonThu(dk) {
  let d = addDays(dk, 1)
  while (isWeekend(d) || isFriday(d)) d = addDays(d, 1)
  return d
}

function buildISO(dk, hour) {
  const [y, m, day] = dk.split('-')
  return `${y}-${m}-${day}T${String(hour).padStart(2, '0')}:00:00-03:00`
}

function buildId(scheduledAt, personId, topicLetter) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: 'numeric', hour12: false,
  }).formatToParts(new Date(scheduledAt))
  const get = t => parts.find(p => p.type === t)?.value ?? ''
  const hour = String(get('hour')).padStart(2, '0')
  return `${get('year')}-${get('month')}-${get('day')}-${hour}-${personId}-${topicLetter}`
}

// ─────────────────────────────────────────────
// 1. Gerar lista de sessões intercalada (round-robin)
// ─────────────────────────────────────────────

// Sessão especial: João Carlos (a) em 28/05 às 16h (único slot do dia)
const SPECIAL_FIRST = { personId: 'joao-carlos', topicLetter: 'a', date: '2026-05-28' }

// Filas por pessoa (JC já usou 'a', começa em 'b')
const queues = {}
for (const p of PEOPLE_ORDER) {
  queues[p] = [...TOPIC_ORDERS[p]]
}
queues['joao-carlos'].shift() // remove 'a' (sessão especial 28/05)

// Gerar sequência round-robin com JC no final de cada rodada
const roundRobinQueue = []
while (ROUND_ROBIN_ORDER.some(p => queues[p].length > 0)) {
  for (const p of ROUND_ROBIN_ORDER) {
    if (queues[p].length > 0) {
      roundRobinQueue.push({ personId: p, topicLetter: queues[p].shift() })
    }
  }
}

// ─────────────────────────────────────────────
// 2. Atribuir datas iniciais (Seg-Sex, 2/dia)
// ─────────────────────────────────────────────

const sessionList = [{ ...SPECIAL_FIRST }] // joao-carlos-a em 28/05

let currentDate = '2026-05-29' // começa 29/05 (Sex)
let slotInDay = 0 // 0 = primeiro slot (14h), 1 = segundo (16h)

for (const s of roundRobinQueue) {
  // Pular fins de semana (sexta é permitida na 1ª fase)
  while (isWeekend(currentDate)) currentDate = addDays(currentDate, 1)

  sessionList.push({ ...s, date: currentDate })
  slotInDay++

  if (slotInDay === 2) {
    currentDate = addDays(currentDate, 1)
    while (isWeekend(currentDate)) currentDate = addDays(currentDate, 1)
    slotInDay = 0
  }
}

// ─────────────────────────────────────────────
// 3. Aplicar cascata de sextas por pessoa
//    Sessão em sexta → vai para o próximo dia da pessoa (cascata)
// ─────────────────────────────────────────────

for (const personId of PEOPLE_ORDER) {
  const pSessions = sessionList.filter(s => s.personId === personId)
  pSessions.sort((a, b) => a.date.localeCompare(b.date))

  const originalDates = pSessions.map(s => s.date)
  const nonFridayDates = originalDates.filter(d => !isFriday(d))
  const fridayCount = originalDates.length - nonFridayDates.length

  if (fridayCount === 0) continue

  // Adiciona novas datas no final para compensar as sextas removidas
  let lastDate = originalDates[originalDates.length - 1]
  for (let i = 0; i < fridayCount; i++) {
    lastDate = nextMonThu(lastDate)
    nonFridayDates.push(lastDate)
  }

  // Reatribui as datas (mantém a ordem das sessões)
  for (let i = 0; i < pSessions.length; i++) {
    pSessions[i].date = nonFridayDates[i]
  }
}

// ─────────────────────────────────────────────
// 4. Atribuir horários (14h e 16h por dia)
// ─────────────────────────────────────────────

// Sessão especial: 28/05 apenas às 16h
const specialFirst = sessionList.find(s => s.personId === 'joao-carlos' && s.topicLetter === 'a')
specialFirst.hour = 16

// Demais: 14h para a 1ª sessão do dia, 16h para a 2ª
const byDay = new Map()
for (const s of sessionList) {
  if (s === specialFirst) continue
  if (!byDay.has(s.date)) byDay.set(s.date, [])
  byDay.get(s.date).push(s)
}

for (const [, daySessions] of byDay) {
  daySessions.sort((a, b) => {
    // Ordenar por pessoa na ordem original (para manter 14h/16h consistente)
    return PEOPLE_ORDER.indexOf(a.personId) - PEOPLE_ORDER.indexOf(b.personId)
  })
  for (let i = 0; i < daySessions.length; i++) {
    daySessions[i].hour = i === 0 ? 14 : (i === 1 ? 16 : 14) // 3ª+ sessão volta pra 14h (caso especial)
  }
}

// ─────────────────────────────────────────────
// 5. Montar objetos YAML e escrever arquivo
// ─────────────────────────────────────────────

async function loadPersistedFromApi() {
  const base = process.env.SCHEDULE_API_URL ?? 'http://127.0.0.1:3334'
  try {
    const res = await fetch(`${base}/api/schedule`)
    if (!res.ok) return null
    const { sessions } = await res.json()
    const map = new Map()
    for (const s of sessions) {
      if (s.status === 'done' || s.status === 'postponed') {
        map.set(`${s.personId}:${s.topicLetter}`, s)
      }
    }
    return map
  } catch {
    console.warn('API indisponível — YAML será gerado sem status do banco')
    return null
  }
}

async function main() {
const yamlSessions = sessionList.map(s => {
  const scheduledAt = buildISO(s.date, s.hour)
  const id = buildId(scheduledAt, s.personId, s.topicLetter)
  const isEncerra = ENCERRA[s.personId] === s.topicLetter
  const notes = isEncerra ? `encerra ${PERSON_NAMES[s.personId]}` : ''
  return { id, scheduledAt, personId: s.personId, topicLetter: s.topicLetter, status: 'scheduled', notes }
})

// Ordenar por scheduledAt
yamlSessions.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))

const persisted = await loadPersistedFromApi()
if (persisted?.size) {
  let preserved = 0
  for (const session of yamlSessions) {
    const snap = persisted.get(`${session.personId}:${session.topicLetter}`)
    if (!snap) continue
    session.status = snap.status
    if (snap.recordedAt) session.recordedAt = snap.recordedAt
    if (snap.notes?.trim()) session.notes = snap.notes
    preserved++
  }
  console.log(`Gravações do banco aplicadas ao YAML: ${preserved}`)
}

// Verificar resultado
const fridayCheck = yamlSessions.filter(s => isFriday(dateKey(s.scheduledAt)))
console.log(`Total sessões: ${yamlSessions.length}`)
console.log(`Sextas restantes: ${fridayCheck.length}`, fridayCheck.map(s => `${s.personId}-${s.topicLetter}: ${dateKey(s.scheduledAt)}`))

// Verificar dias com >2 sessões
const dayCount = new Map()
for (const s of yamlSessions) {
  const dk = dateKey(s.scheduledAt)
  dayCount.set(dk, (dayCount.get(dk) || 0) + 1)
}
const overloaded = [...dayCount.entries()].filter(([, n]) => n > 2)
console.log(`Dias com >2 sessões: ${overloaded.length}`, overloaded.map(([d, n]) => `${d}=${n}`))

// Salvar YAML
const outputSessions = yamlSessions.map((s) => {
  const row = { ...s }
  if (!row.notes) delete row.notes
  if (!row.recordedAt) delete row.recordedAt
  return row
})
fs.writeFileSync(YAML_PATH, dump({ sessions: outputSessions }, { lineWidth: 160, noRefs: true }), 'utf-8')
console.log('✅ sessions.yaml atualizado!')

// Mostrar resumo por data (primeiros 30 dias)
const datesSorted = [...new Set(yamlSessions.map(s => dateKey(s.scheduledAt)))].sort().slice(0, 30)
for (const d of datesSorted) {
  const dow = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][dayOfWeek(d)]
  const sessions = yamlSessions.filter(s => dateKey(s.scheduledAt) === d)
  const slots = sessions.map(s => `${s.personId}(${s.topicLetter}${s.status === 'done' ? '✓' : ''})`).join(', ')
  console.log(`${d} ${dow}: ${slots}`)
}
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
