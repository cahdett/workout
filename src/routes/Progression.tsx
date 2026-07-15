import { Link } from 'react-router-dom'
import { useProgressionReport, type ExerciseProgressSummary } from '../hooks/useProgressionReport'
import { MUSCLE_GROUPS } from '../constants/muscleGroups'

function TrendBadge({ trend }: { trend: ExerciseProgressSummary['trend'] }) {
  if (trend === 'improving') {
    return (
      <span className="rounded-full bg-green-400/10 px-2 py-0.5 text-xs font-medium text-green-400">📈 Improving</span>
    )
  }
  if (trend === 'plateaued') {
    return (
      <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-300">⚠️ Plateaued</span>
    )
  }
  return <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-500">Not enough data</span>
}

export default function Progression() {
  const { summaries, loading } = useProgressionReport()

  const plateaued = summaries.filter((s) => s.trend === 'plateaued')

  const groups = new Map<string, ExerciseProgressSummary[]>()
  for (const s of summaries) {
    const key = s.muscleGroup ?? 'Uncategorized'
    const list = groups.get(key) ?? []
    list.push(s)
    groups.set(key, list)
  }
  const groupOrder = [...MUSCLE_GROUPS, 'Uncategorized'].filter((g) => groups.has(g))

  return (
    <div className="px-4 pb-24 pt-[calc(1rem+var(--safe-top))]">
      <h1 className="mb-4 text-2xl font-semibold">Progression</h1>

      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : summaries.length === 0 ? (
        <p className="text-zinc-500">Log a few workouts to start seeing progression here.</p>
      ) : (
        <>
          {plateaued.length > 0 && (
            <div className="mb-6 rounded-lg border border-amber-400/40 bg-amber-400/10 p-4">
              <p className="font-medium text-amber-300">
                ⚠️ {plateaued.length} exercise{plateaued.length > 1 ? 's' : ''} plateaued
              </p>
              <p className="text-sm text-amber-300/80">
                No new weight or rep PR in the last 3+ sessions: {plateaued.map((p) => p.name).join(', ')}
              </p>
            </div>
          )}

          <div className="space-y-6">
            {groupOrder.map((group) => (
              <div key={group}>
                <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-zinc-500">{group}</h2>
                <ul className="divide-y divide-zinc-800 rounded-lg bg-zinc-900/50">
                  {groups.get(group)!.map((s) => (
                    <li key={s.exerciseId}>
                      <Link to={`/exercise/${s.exerciseId}`} className="block px-4 py-3">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="font-medium">{s.name}</span>
                          <TrendBadge trend={s.trend} />
                        </div>
                        <p className="text-sm text-zinc-500">
                          {s.sessionsCount === 0
                            ? 'No sets logged yet'
                            : `${s.sessionsCount} session${s.sessionsCount > 1 ? 's' : ''} · best est. 1RM ${Math.round(s.bestE1RM)} lb`}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
