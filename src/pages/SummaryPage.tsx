import { useMemo } from 'react'
import type { Person, Session } from '../lib/types'
import { globalTopicStats, personTopicProgress } from '../lib/topicSessions'

interface Props {
  people: Person[]
  sessions: Session[]
}

export function SummaryPage({ people, sessions }: Props) {
  const stats = useMemo(() => globalTopicStats(people, sessions), [people, sessions])
  const progress = useMemo(() => personTopicProgress(people, sessions), [people, sessions])
  const pct =
    stats.totalTopics === 0 ? 0 : Math.round((stats.doneTopics / stats.totalTopics) * 100)

  return (
    <section>
      <div className="stat-grid">
        <Stat label="Tópicos concluídos" value={stats.doneTopics} tone="done" />
        <Stat label="Tópicos pendentes" value={stats.remainingTopics} tone="remaining" />
        <Stat label="Parciais" value={stats.partialTopics} tone="scheduled" />
        <Stat label="Sem sessão" value={stats.unscheduledTopics} tone="postponed" />
        <Stat label="Total tópicos" value={stats.totalTopics} tone="total" />
      </div>

      <div className="overall">
        <div className="progress big">
          <div className="progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <p className="sub">{pct}% dos tópicos concluídos</p>
      </div>

      <h3 className="section-title">Progresso por pessoa</h3>
      <div className="summary-table-wrap">
        <table className="summary-table">
          <thead>
            <tr>
              <th>Pessoa</th>
              <th>Tópicos concluídos</th>
              <th>Pendentes</th>
              <th>Total tópicos</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {progress.map((p) => (
              <tr key={p.person.id}>
                <td>{p.person.name}</td>
                <td>{p.doneTopics}</td>
                <td>{p.remainingTopics}</td>
                <td>{p.totalTopics}</td>
                <td>
                  {p.totalTopics === 0 ? 0 : Math.round((p.doneTopics / p.totalTopics) * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`stat stat-${tone}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}
