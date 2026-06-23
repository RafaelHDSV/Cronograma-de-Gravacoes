export type SessionStatus = 'scheduled' | 'done' | 'postponed'

export interface Topic {
  letter: string
  title: string
}

export interface Person {
  id: string
  name: string
  topics: Topic[]
  topicOrder?: string[]
}

export interface Session {
  id: string
  scheduledAt: string
  personId: string
  topicLetter: string
  status: SessionStatus
  recordedAt?: string
}

export interface ScheduleData {
  people: Person[]
  sessions: Session[]
}
