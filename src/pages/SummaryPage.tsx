import { useMemo } from 'react'
import type { Person, Session } from '../lib/types'
import { globalStats, personProgress } from '../lib/schedule'

interface Props {
  people: Person[]
  sessions: Session[]
}

export function SummaryPage({ people, sessions }: Props) {
  const stats = useMemo(() => globalStats(sessions), [sessions])
  const progress = useMemo(() => personProgress(people, sessions), [people, sessions])
  const pct = stats.total === 0 ? 0 : Math.round((stats.done / stats.total) * 100)

  return (
    <section>
      <div className="stat-grid">
        <Stat label="Já gravadas" value={stats.done} tone="done" />
        <Stat label="Faltam" value={stats.remaining} tone="remaining" />
        <Stat label="Agendadas" value={stats.scheduled} tone="scheduled" />
        <Stat label="Adiadas" value={stats.postponed} tone="postponed" />
        <Stat label="Total" value={stats.total} tone="total" />
      </div>

      <div className="overall">
        <div className="progress big">
          <div className="progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <p className="sub">{pct}% do cronograma concluído</p>
      </div>

      <h3 className="section-title">Progresso por pessoa</h3>
      <div className="summary-table-wrap">
        <table className="summary-table">
          <thead>
            <tr>
              <th>Pessoa</th>
              <th>Gravadas</th>
              <th>Restantes</th>
              <th>Total</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {progress.map((p) => (
              <tr key={p.person.id}>
                <td>{p.person.name}</td>
                <td>{p.done}</td>
                <td>{p.remaining}</td>
                <td>{p.total}</td>
                <td>{p.total === 0 ? 0 : Math.round((p.done / p.total) * 100)}%</td>
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
