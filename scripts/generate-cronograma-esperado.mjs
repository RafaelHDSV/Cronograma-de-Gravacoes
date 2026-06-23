/**
 * Gera docs/cronograma-esperado.md a partir do Discord.
 *
 * Modelo:
 * - Cada (data, hora) tem no máximo UMA gravação (sala única).
 * - A pessoa do slot é fixa (rodízio + trocas); o tópico muda com a ordem da pessoa.
 * - Sextas: slots já gravados (done na sexta) permanecem; demais sextas ficam vazias
 *   e o tópico pendente passa para o próximo slot ativo da mesma pessoa.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { load } from 'js-yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DISCORD_JSON = path.join(ROOT, 'docs', 'agx-discord.json')
const PEOPLE_YAML = path.join(ROOT, 'public', 'data', 'people.yaml')
const OUT_MD = path.join(ROOT, 'docs', 'cronograma-esperado.md')

const PERSON_ID = {
  'João Carlos': 'joao-carlos',
  Janderson: 'janderson',
  Vinicius: 'vinicius',
  Robson: 'robson',
  Marcus: 'marcus',
  Vieira: 'vieira',
  Davi: 'davi',
}

const PERSON_NAME = Object.fromEntries(
  Object.entries(PERSON_ID).map(([name, id]) => [id, name]),
)

const JANDERSON_TOPICS = ['a', 'b', 'l', 'm', 'n', 'f', 'e', 'c', 'd', 'g', 'h', 'i', 'j', 'k']

/** Discord username → personId */
const AUTHOR_TO_PERSON = {
  jandersonrodrigues: 'janderson',
  'joaocarlos.': 'joao-carlos',
  vini04499: 'vinicius',
  borischugus: 'robson',
  marcuslara: 'marcus',
  rafaelvieira1720: 'vieira',
  davi248912: 'davi',
}

/** Gravações confirmadas fora do export Discord (sem mensagem explícita no HTML). */
const MANUAL_DONE = [
  { personId: 'vieira', letter: 'a' },
  { personId: 'vieira', letter: 'b' },
]

/** Data/hora em que a gravação ocorreu (Discord + acordos explícitos). */
const RECORDED_ON_BINDINGS = [
  { personId: 'joao-carlos', letter: 'a', date: '2026-06-02', hour: 16 },
  { personId: 'janderson', letter: 'a', date: '2026-05-29', hour: 14 },
  { personId: 'janderson', letter: 'b', date: '2026-06-05', hour: 16 },
  { personId: 'janderson', letter: 'l', date: '2026-06-09', hour: 14 },
  { personId: 'janderson', letter: 'm', date: '2026-06-12', hour: 16 },
  { personId: 'janderson', letter: 'n', date: '2026-06-18', hour: 14 },
  { personId: 'vinicius', letter: 'b', date: '2026-06-03', hour: 14 },
  { personId: 'vinicius', letter: 'c', date: '2026-06-09', hour: 16 },
  { personId: 'robson', letter: 'b', date: '2026-06-03', hour: 16 },
  { personId: 'marcus', letter: 'b', date: '2026-06-05', hour: 14 },
  { personId: 'marcus', letter: 'c', date: '2026-06-11', hour: 14 },
  { personId: 'davi', letter: 'a', date: '2026-06-11', hour: 16 },
  { personId: 'vieira', letter: 'c', date: '2026-06-22', hour: 14 },
]

const DOW_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

/** Trocas, slots pulados e remanejamentos citados no Discord (`agx-discord.json`). */
const SLOT_EVENTS = [
  { date: '2026-06-02', hour: 14, type: 'missed', note: 'Vieira pulou o dia (Discord 03/06)' },
  { date: '2026-06-02', hour: 16, type: 'person', personId: 'joao-carlos', note: 'JC: Qua 14h → Ter 16h (Discord 02/06)' },
  { date: '2026-06-03', hour: 14, type: 'person', personId: 'vinicius', note: 'Vinicius 14h (Discord 03/06)' },
  { date: '2026-06-03', hour: 16, type: 'person', personId: 'robson', note: 'Janderson ↔ Robson (Discord 03/06)' },
  { date: '2026-06-05', hour: 16, type: 'person', personId: 'janderson', note: 'Janderson no horário do Robson (Discord 03/06)' },
  { date: '2026-06-10', hour: 16, type: 'person', personId: 'vieira', note: 'Marcus ↔ Vieira (Discord 10/06)' },
  { date: '2026-06-11', hour: 14, type: 'person', personId: 'marcus', note: 'Marcus ↔ Vieira (Discord 10/06)' },
  { date: '2026-06-15', hour: 14, type: 'person', personId: 'robson', note: 'Discord 15/06' },
  { date: '2026-06-15', hour: 16, type: 'person', personId: 'vieira', note: 'Discord 15/06' },
  { date: '2026-06-16', hour: 14, type: 'missed', note: 'JC sem voz; slot vazio (Discord 16/06)' },
  { date: '2026-06-16', hour: 16, type: 'person', personId: 'vinicius', note: 'Marcus ↔ JC (Discord 16/06)' },
  { date: '2026-06-17', hour: 14, type: 'person', personId: 'marcus', note: 'Marcus ↔ JC (Discord 16/06)' },
  { date: '2026-06-17', hour: 16, type: 'person', personId: 'davi', note: 'Marcus ↔ JC (Discord 16/06)' },
]

function parseBaseSlots(msgs) {
  const baseMsg = msgs.find((m) => m.type === 19 && m.content?.includes('Cronograma aleatoriamente gerado'))
  if (!baseMsg) throw new Error('Cronograma base não encontrado no Discord')

  const slots = []
  const year = 2026

  for (const line of baseMsg.content.split('\n')) {
    const dayMatch = line.match(/^(\d{2})\/(\d{2}) \((\w+)\)/)
    if (dayMatch) {
      const [, dd, mm, dow] = dayMatch
      slots._current = { date: `${year}-${mm}-${dd}`, dow }
      continue
    }
    const slotMatch = line.match(/^- (\d{2})h — (.+?) \((.+?)\)/)
    if (slotMatch && slots._current) {
      const [, hour, personName] = slotMatch
      const personId = PERSON_ID[personName.trim()]
      if (!personId) continue
      slots.push({
        date: slots._current.date,
        dow: slots._current.dow,
        hour: Number(hour),
        personId,
        personName: personName.trim(),
      })
    }
  }

  return slots
}

function loadPeople() {
  return load(fs.readFileSync(PEOPLE_YAML, 'utf-8')).people
}

function topicOrderFor(personId, people) {
  if (personId === 'janderson') return [...JANDERSON_TOPICS]
  const person = people.find((p) => p.id === personId)
  return person?.topics.map((t) => t.letter) ?? []
}

function topicTitles(people) {
  const map = new Map()
  for (const p of people) {
    for (const t of p.topics) {
      map.set(`${p.id}:${t.letter}`, t.title)
    }
  }
  return map
}

function isFriday(date) {
  return new Date(`${date}T12:00:00-03:00`).getDay() === 5
}

function dayKeyFromIso(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d)
}

function authorPersonId(msg) {
  const username = msg.author?.username ?? ''
  return AUTHOR_TO_PERSON[username] ?? null
}

function parseCapDoneLetters(content) {
  const letters = []
  for (const line of content.split('\n')) {
    if (!/->\s*done/i.test(line)) continue
    const m = line.match(/cap(?:ítulo|\.)?\s*\d+\s*[—–-]\s*([a-z])\./i)
    if (m) letters.push(m[1].toLowerCase())
  }
  return letters
}

function parseDoneLetter(content, personId) {
  if (/não consegui finalizar|não finalizei/i.test(content)) return null
  if (/parte 1 gravado/i.test(content) && !/finalizei/i.test(content)) return null

  let m = content.match(/gravei e revisei[\s\S]*?cap\.\s*\d+\s*[—–-]\s*([a-z])\./i)
  if (m) return m[1].toLowerCase()

  m = content.match(/finalizei (?:a gravação do |o vídeo do )?item\s*[\(\[]?([a-z])[\)\]]?/i)
  if (m) return m[1].toLowerCase()

  m = content.match(/finalizei a gravação do item ([a-z])/i)
  if (m) return m[1].toLowerCase()

  m = content.match(/item\s*[\(\[]?([a-z])[\)\]]?\s*(?:gravado|concluído)/i)
  if (m) return m[1].toLowerCase()

  m = content.match(/item ([a-z]) concluído/i)
  if (m) return m[1].toLowerCase()

  m = content.match(/finalizei (?:os ajustes do )?o item ([a-z])/i)
  if (m) return m[1].toLowerCase()

  if (personId === 'janderson') {
    if (/atualização de steps/i.test(content) && /gravado/i.test(content)) return 'l'
    if (/capitulo 1 da ac/i.test(content)) return 'a'
  }

  return null
}

function parseDiscordDone(msgs) {
  const recordings = []
  const seen = new Set()

  function add(rec) {
    const key = `${rec.personId}:${rec.letter}`
    if (seen.has(key)) return
    seen.add(key)
    recordings.push(rec)
  }

  for (const msg of msgs) {
    const personId = authorPersonId(msg)
    if (!personId) continue
    const content = msg.content ?? ''
    const announcedOn = dayKeyFromIso(msg.timestamp)

    for (const letter of parseCapDoneLetters(content)) {
      add({ personId, letter, announcedOn })
    }

    const letter = parseDoneLetter(content, personId)
    if (letter) add({ personId, letter, announcedOn })
  }

  for (const manual of MANUAL_DONE) {
    add(manual)
  }

  for (const binding of RECORDED_ON_BINDINGS) {
    add(binding)
  }

  return recordings
}

function recordingsToState(recordings) {
  const doneTopics = new Set(recordings.map((r) => `${r.personId}:${r.letter}`))
  const recordedOn = new Map()
  for (const r of recordings) {
    if (r.date) {
      recordedOn.set(`${r.personId}:${r.letter}`, { date: r.date, hour: r.hour ?? 14 })
    }
  }
  for (const binding of RECORDED_ON_BINDINGS) {
    recordedOn.set(`${binding.personId}:${binding.letter}`, {
      date: binding.date,
      hour: binding.hour ?? 14,
    })
  }
  return { doneTopics, recordedOn, recordings }
}

function buildFridayDoneKeys(recordings, slots) {
  const keys = new Set()
  for (const rec of recordings) {
    const fridayDate = rec.announcedOn
    if (!fridayDate || !isFriday(fridayDate)) continue
    const slot =
      slots.find((s) => s.personId === rec.personId && s.date === fridayDate) ??
      slots.find((s) => s.date === fridayDate)
    if (slot) {
      keys.add(`${slot.date}:${slot.hour}:${slot.personId}`)
    }
  }
  return keys
}

function isDoneOnSlot(personId, letter, slot, doneTopics, recordedOn) {
  const key = `${personId}:${letter}`
  if (!doneTopics.has(key)) return false
  const bound = recordedOn.get(key)
  if (!bound) return true
  return bound.date === slot.date && bound.hour === slot.hour
}

function applySlotEvents(slots) {
  const byKey = new Map(slots.map((s) => [`${s.date}:${s.hour}`, s]))
  for (const event of SLOT_EVENTS) {
    const slot = byKey.get(`${event.date}:${event.hour}`)
    if (!slot) continue
    if (event.type === 'missed') {
      slot.missed = true
      slot.missedNote = event.note
      continue
    }
    slot.originalPersonId = slot.originalPersonId ?? slot.personId
    slot.personId = event.personId
    slot.personName = PERSON_NAME[event.personId]
    slot.swapApplied = true
    slot.swapNote = event.note
  }
}

function nextBusinessDateAfter(date) {
  const d = new Date(`${date}T12:00:00-03:00`)
  do {
    d.setDate(d.getDate() + 1)
  } while ([0, 5, 6].includes(d.getDay()))
  return d.toISOString().slice(0, 10)
}

function findNextFreeSlot(occupied, startDate) {
  let date = startDate
  for (let guard = 0; guard < 500; guard++) {
    if (!isFriday(date) && new Date(`${date}T12:00:00-03:00`).getDay() !== 0 && new Date(`${date}T12:00:00-03:00`).getDay() !== 6) {
      for (const hour of [14, 16]) {
        const key = `${date}:${hour}`
        if (!occupied.has(key)) return { date, hour }
      }
    }
    date = nextBusinessDateAfter(date)
  }
  throw new Error('Não foi possível encontrar slot livre')
}

function assignTopics(slots, people, doneTopics, recordedOn, fridayDoneKeys) {
  const byPerson = new Map()
  for (const slot of slots) {
    if (slot.missed) continue
    const fridayKey = `${slot.date}:${slot.hour}:${slot.personId}`
    const onFriday = isFriday(slot.date)
    if (onFriday && !fridayDoneKeys.has(fridayKey)) {
      slot.skippedFriday = true
      continue
    }
    if (!byPerson.has(slot.personId)) byPerson.set(slot.personId, [])
    byPerson.get(slot.personId).push(slot)
  }

  const sessions = []
  const occupied = new Set()
  const remaining = new Map()

  for (const [personId, personSlots] of byPerson) {
    personSlots.sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour)
    const order = topicOrderFor(personId, people)
    const usedSlots = new Set()
    const usedLetters = new Set()

    for (const letter of order) {
      const bound = recordedOn.get(`${personId}:${letter}`)
      if (!bound) continue
      const slot = personSlots.find((s) => s.date === bound.date && s.hour === bound.hour)
      if (!slot) continue
      const key = `${slot.date}:${slot.hour}`
      if (usedSlots.has(key)) continue
      usedSlots.add(key)
      usedLetters.add(letter)
      const isDone = isDoneOnSlot(personId, letter, slot, doneTopics, recordedOn)
      sessions.push({
        ...slot,
        topicLetter: letter,
        status: isDone ? 'done' : 'scheduled',
        keptFriday: isFriday(slot.date) && isDone,
      })
      occupied.add(key)
    }

    let topicIdx = 0
    for (const slot of personSlots) {
      const slotKey = `${slot.date}:${slot.hour}`
      if (usedSlots.has(slotKey)) continue
      while (topicIdx < order.length && usedLetters.has(order[topicIdx])) topicIdx++
      if (topicIdx >= order.length) break
      const topicLetter = order[topicIdx++]
      usedLetters.add(topicLetter)
      const isDone = isDoneOnSlot(personId, topicLetter, slot, doneTopics, recordedOn)
      sessions.push({
        ...slot,
        topicLetter,
        status: isDone ? 'done' : 'scheduled',
        keptFriday: isFriday(slot.date) && isDone,
      })
      occupied.add(slotKey)
    }

    const assigned = new Set([...usedLetters])
    const pending = order.filter((l) => !assigned.has(l))
    if (pending.length) remaining.set(personId, pending)
  }

  const lastGridDate = slots.reduce((max, s) => (s.date > max ? s.date : max), '2026-05-28')
  sessions.push(
    ...scheduleAppendedInterleaved(remaining, occupied, doneTopics, recordedOn, lastGridDate),
  )

  sessions.sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour)
  return sessions
}

function isAdjacentSlot(prev, date, hour) {
  if (!prev) return false
  if (prev.date === date && prev.hour === 14 && hour === 16) return true
  if (prev.hour === 16 && hour === 14) {
    const d = new Date(`${prev.date}T12:00:00-03:00`)
    do {
      d.setDate(d.getDate() + 1)
    } while ([0, 5, 6].includes(d.getDay()))
    if (d.toISOString().slice(0, 10) === date) return true
  }
  return false
}

function wouldBeConsecutiveForPerson(personId, date, hour, sessions, lastAssigned) {
  if (sessions.some((s) => s.personId === personId && s.date === date)) return true
  if (lastAssigned?.personId === personId && isAdjacentSlot(lastAssigned, date, hour)) return true
  return false
}

/** Distribui sessões *(+prazo)* intercalando pessoas quando houver alternativa. */
function scheduleAppendedInterleaved(remaining, occupied, doneTopics, recordedOn, startCursor) {
  const queues = new Map(
    [...remaining.entries()].map(([personId, letters]) => [personId, [...letters]]),
  )
  const sessions = []
  const personOrder = [...queues.keys()]
  let cursor = startCursor
  let lastAssigned = null
  let rotIdx = 0

  const hasPending = () => [...queues.values()].some((q) => q.length > 0)

  while (hasPending()) {
    const { date, hour } = findNextFreeSlot(occupied, cursor)
    const active = personOrder.filter((pid) => queues.get(pid)?.length > 0)
    if (active.length === 0) break

    let chosen = null
    for (let attempt = 0; attempt < active.length; attempt++) {
      const pid = personOrder[rotIdx % personOrder.length]
      rotIdx++
      if (!queues.get(pid)?.length) continue
      if (
        active.length > 1 &&
        wouldBeConsecutiveForPerson(pid, date, hour, sessions, lastAssigned)
      ) {
        continue
      }
      chosen = pid
      break
    }
    if (!chosen) chosen = active[0]

    const topicLetter = queues.get(chosen).shift()
    const isDone = isDoneOnSlot(chosen, topicLetter, { date, hour }, doneTopics, recordedOn)
    sessions.push({
      date,
      dow: DOW_PT[new Date(`${date}T12:00:00-03:00`).getDay()],
      hour,
      personId: chosen,
      personName: PERSON_NAME[chosen],
      topicLetter,
      status: isDone ? 'done' : 'scheduled',
      appended: true,
    })
    occupied.add(`${date}:${hour}`)
    lastAssigned = { personId: chosen, date, hour }
    cursor = date
  }

  return sessions
}

function validateUniqueSlots(sessions) {
  const keys = new Map()
  for (const s of sessions) {
    const k = `${s.date}:${s.hour}`
    if (keys.has(k)) {
      throw new Error(`Conflito de sala em ${k}: ${keys.get(k)} e ${s.personName}`)
    }
    keys.set(k, s.personName)
  }
}

function formatDateBR(iso) {
  const [, mm, dd] = iso.split('-')
  return `${dd}/${mm}`
}

function buildMarkdown(sessions, slots, titles, doneTopics, recordedOn) {
  const lines = []
  lines.push('# Cronograma esperado — Capacitação AGX')
  lines.push('')
  lines.push('Documento gerado a partir do chat Discord (`docs/AGX Soft_AGX Softwa_2026-05-20_to_2026-06-23.html`).')
  lines.push(`Última geração: ${new Date().toISOString().slice(0, 10)}.`)
  lines.push('')
  lines.push('## Regras')
  lines.push('')
  lines.push('- **Sala única:** cada combinação data + horário comporta **no máximo uma** gravação (14h ou 16h).')
  lines.push('- **Pessoa fixa no slot:** o participante do horário vem do rodízio original (+ trocas no Discord).')
  lines.push('- **Tópico variável:** a letra gravada segue a ordem de tópicos da pessoa (reordenação do Janderson, etc.).')
  lines.push('- **Sextas:** gravações **já concluídas na sexta** permanecem; sextas futuras sem gravação ficam **vazias** e o tópico pendente vai para o próximo slot ativo da mesma pessoa (estendendo o prazo se necessário).')
  lines.push('- **Trocas e imprevistos:** slots remanejados ou pulados conforme mensagens no Discord (jun/2026).')
  lines.push('- Sessões *(+prazo)*: intercaladas entre pessoas quando possível, para evitar sequências longas do mesmo gravador.')
  lines.push('- A data final **pode aumentar** conforme migrações e novas ordenações.')
  lines.push('')
  lines.push('## Trocas e slots especiais (Discord)')
  lines.push('')
  lines.push('| Data | Horário | Situação | Referência |')
  lines.push('|------|---------|----------|------------|')
  for (const event of SLOT_EVENTS) {
    const desc =
      event.type === 'missed'
        ? '*(pulado)*'
        : `**${PERSON_NAME[event.personId]}** *(troca)*`
    lines.push(`| ${formatDateBR(event.date)} | ${event.hour}h | ${desc} | ${event.note} |`)
  }
  lines.push('')
  lines.push('## Gravações já concluídas')
  lines.push('')
  lines.push('Somente tópicos com confirmação explícita no Discord («finalizei», «gravado», «concluído», «Gravei e Revisei», `-> done`) ou informados manualmente (Vieira A/B/C).')
  lines.push('')
  lines.push('| Pessoa | Tópico | Título |')
  lines.push('|--------|--------|--------|')
  for (const key of [...doneTopics].sort()) {
    const [personId, letter] = key.split(':')
    lines.push(`| ${PERSON_NAME[personId]} | **${letter}** | ${titles.get(key) ?? '—'} |`)
  }
  lines.push('')
  lines.push('## Cronograma por data')
  lines.push('')
  lines.push('Legenda: ✅ concluída · *(sexta mantida)* · *(sexta vazia)* · *(pulado)* slot sem gravação · *(troca)* · *(+prazo)* slot extra')
  lines.push('')
  lines.push('| Data | Dia | 14h | 16h |')
  lines.push('|------|-----|-----|-----|')

  const sessionByKey = new Map(sessions.map((s) => [`${s.date}:${s.hour}`, s]))
  const missedSlots = new Set(slots.filter((s) => s.missed).map((s) => `${s.date}:${s.hour}`))
  const skippedFridays = new Set(
    slots.filter((s) => s.skippedFriday).map((s) => `${s.date}:${s.hour}`),
  )

  const allDates = new Set([...slots.map((s) => s.date), ...sessions.map((s) => s.date)])
  for (const date of [...allDates].sort()) {
    const dow = DOW_PT[new Date(`${date}T12:00:00-03:00`).getDay()]
    const fmt = (hour) => {
      const key = `${date}:${hour}`
      if (skippedFridays.has(key)) return '*(sexta vazia)*'
      if (missedSlots.has(key)) return '*(pulado)*'
      const s = sessionByKey.get(key)
      if (!s) return '—'
      const done = isDoneOnSlot(s.personId, s.topicLetter, s, doneTopics, recordedOn)
      const mark = done || s.status === 'done' ? ' ✅' : ''
      const tags = [
        s.keptFriday ? '*(sexta mantida)*' : '',
        s.swapApplied ? '*(troca)*' : '',
        s.appended ? '*(+prazo)*' : '',
      ].filter(Boolean).join(' ')
      const title = titles.get(`${s.personId}:${s.topicLetter}`)
      const short = title ? ` — ${title.slice(0, 42)}${title.length > 42 ? '…' : ''}` : ''
      return `**${s.personName}** (${s.topicLetter})${mark}${tags ? ` ${tags}` : ''}${short}`
    }
    lines.push(`| ${formatDateBR(date)} | ${dow} | ${fmt(14)} | ${fmt(16)} |`)
  }

  lines.push('')
  lines.push('## Sequência por pessoa')
  lines.push('')
  for (const personId of Object.values(PERSON_ID)) {
    lines.push(`### ${PERSON_NAME[personId]}`)
    lines.push('')
    const list = sessions.filter((s) => s.personId === personId)
    for (const s of list) {
      const done = isDoneOnSlot(s.personId, s.topicLetter, s, doneTopics, recordedOn)
      const title = titles.get(`${s.personId}:${s.topicLetter}`) ?? ''
      const tag = [
        s.keptFriday ? ' *(sexta mantida)*' : '',
        s.appended ? ' *(+prazo)*' : '',
        s.swapApplied ? ' *(troca)*' : '',
      ].join('')
      lines.push(`- ${formatDateBR(s.date)} ${s.hour}h — **${s.topicLetter}** ${title}${done ? ' ✅' : ''}${tag}`)
    }
    lines.push('')
  }

  lines.push('## Fontes')
  lines.push('')
  lines.push('- Cronograma base: Discord «Cronograma aleatoriamente gerado».')
  lines.push('- Ordem Janderson: mensagem de 11/06.')
  lines.push('- Sextas: anúncio de 23/06 (manter done; migrar pendentes).')
  lines.push('- Fonte de mensagens: `docs/agx-discord.json` (export Discord 20/05–23/06).')
  lines.push('- Progresso: confirmações explícitas no chat + Vieira A/B/C (C em 22/06).')
  lines.push('')

  return lines.join('\n')
}

export function buildExpectedSchedule() {
  const msgs = JSON.parse(fs.readFileSync(DISCORD_JSON, 'utf-8'))
  const people = loadPeople()
  const slots = parseBaseSlots(msgs)
  applySlotEvents(slots)

  const recordings = parseDiscordDone(msgs)
  const { doneTopics, recordedOn } = recordingsToState(recordings)
  const fridayDoneKeys = buildFridayDoneKeys(recordings, slots)

  for (const slot of slots) {
    if (isFriday(slot.date) && !fridayDoneKeys.has(`${slot.date}:${slot.hour}:${slot.personId}`)) {
      slot.skippedFriday = true
    }
  }

  const sessions = assignTopics(slots, people, doneTopics, recordedOn, fridayDoneKeys)
  validateUniqueSlots(sessions)

  const dbSessions = sessions.map((s) => toDbSession(s, doneTopics, recordedOn))

  return { sessions, dbSessions, doneTopics, recordedOn, slots, people }
}

function toDbSession(s, doneTopics, recordedOn) {
  const hour = String(s.hour).padStart(2, '0')
  const id = `${s.date}-${hour}-${s.personId}-${s.topicLetter}`
  const scheduledAt = `${s.date}T${hour}:00:00-03:00`
  const done = isDoneOnSlot(s.personId, s.topicLetter, s, doneTopics, recordedOn) || s.status === 'done'
  const bound = recordedOn.get(`${s.personId}:${s.topicLetter}`)
  const row = {
    id,
    scheduledAt,
    personId: s.personId,
    topicLetter: s.topicLetter,
    status: done ? 'done' : 'scheduled',
  }
  if (done) row.recordedAt = bound?.date ?? s.date
  return row
}

function main() {
  const { sessions, doneTopics, recordedOn, slots, people } = buildExpectedSchedule()
  const md = buildMarkdown(sessions, slots, topicTitles(people), doneTopics, recordedOn)
  fs.writeFileSync(OUT_MD, md, 'utf-8')
  console.log(`✅ ${path.relative(ROOT, OUT_MD)} (${sessions.length} sessões, sala única por horário)`)
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
if (isMain) main()
