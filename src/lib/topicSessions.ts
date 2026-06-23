import type { Person, Session, Topic } from './types'
import { getOrderedTopics } from './topicOrder'
import { compareSessionsByTime } from './schedule'

export interface TopicGroup {
  topicLetter: string
  topic: Topic
  sessions: Session[]
  sessionCount: number
  doneCount: number
  isComplete: boolean
  hasAnySession: boolean
}

export function sessionsForTopic(
  sessions: Session[],
  personId: string,
  letter: string,
): Session[] {
  return sessions
    .filter((s) => s.personId === personId && s.topicLetter === letter)
    .sort(compareSessionsByTime)
}

export function isTopicComplete(topicSessions: Session[]): boolean {
  if (topicSessions.length === 0) return false
  return topicSessions.every((s) => s.status === 'done')
}

export function groupPersonTopics(person: Person, sessions: Session[]): TopicGroup[] {
  return getOrderedTopics(person).map((topic) => {
    const topicSessions = sessionsForTopic(sessions, person.id, topic.letter)
    const doneCount = topicSessions.filter((s) => s.status === 'done').length
    return {
      topicLetter: topic.letter,
      topic,
      sessions: topicSessions,
      sessionCount: topicSessions.length,
      doneCount,
      isComplete: isTopicComplete(topicSessions),
      hasAnySession: topicSessions.length > 0,
    }
  })
}

export function topicGroupForSession(
  person: Person | undefined,
  sessions: Session[],
  session: Session,
): TopicGroup | null {
  if (!person) return null
  return groupPersonTopics(person, sessions).find((g) => g.topicLetter === session.topicLetter) ?? null
}

/** Badge curto ex.: "a · 2/3" — null quando so 1 sessao. */
export function topicProgressLabel(group: TopicGroup): string | null {
  if (group.sessionCount <= 1) return null
  return `${group.topicLetter} · ${group.doneCount}/${group.sessionCount}`
}

export interface GlobalTopicStats {
  totalTopics: number
  doneTopics: number
  partialTopics: number
  unscheduledTopics: number
  remainingTopics: number
  totalSessions: number
  doneSessions: number
  scheduledSessions: number
  postponedSessions: number
}

export function globalTopicStats(people: Person[], sessions: Session[]): GlobalTopicStats {
  let totalTopics = 0
  let doneTopics = 0
  let partialTopics = 0
  let unscheduledTopics = 0

  for (const person of people) {
    for (const group of groupPersonTopics(person, sessions)) {
      totalTopics++
      if (group.isComplete) doneTopics++
      else if (group.hasAnySession) partialTopics++
      else unscheduledTopics++
    }
  }

  return {
    totalTopics,
    doneTopics,
    partialTopics,
    unscheduledTopics,
    remainingTopics: totalTopics - doneTopics,
    totalSessions: sessions.length,
    doneSessions: sessions.filter((s) => s.status === 'done').length,
    scheduledSessions: sessions.filter((s) => s.status === 'scheduled').length,
    postponedSessions: sessions.filter((s) => s.status === 'postponed').length,
  }
}

export interface PersonTopicProgress {
  person: Person
  totalTopics: number
  doneTopics: number
  remainingTopics: number
  sessions: Session[]
  groups: TopicGroup[]
}

export function personTopicProgress(people: Person[], sessions: Session[]): PersonTopicProgress[] {
  return [...people]
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .map((person) => {
    const own = sessions
      .filter((s) => s.personId === person.id)
      .sort(compareSessionsByTime)
    const groups = groupPersonTopics(person, sessions)
    const doneTopics = groups.filter((g) => g.isComplete).length
    return {
      person,
      totalTopics: person.topics.length,
      doneTopics,
      remainingTopics: person.topics.length - doneTopics,
      sessions: own,
      groups,
    }
  })
}
