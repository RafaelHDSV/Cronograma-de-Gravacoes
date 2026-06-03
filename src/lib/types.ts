export type SessionStatus = 'scheduled' | 'done' | 'postponed'

export interface Topic {
  letter: string
  title: string
}

export interface Person {
  id: string
  name: string
  topics: Topic[]
}

export interface Session {
  id: string
  scheduledAt: string
  personId: string
  topicLetter: string
  status: SessionStatus
  notes?: string
  recordedAt?: string
}

export interface ScheduleData {
  people: Person[]
  sessions: Session[]
}
