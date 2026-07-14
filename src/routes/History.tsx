import { Link } from 'react-router-dom'
import { useWorkoutHistory } from '../hooks/useWorkoutHistory'
import { useExercises } from '../hooks/useExercises'

export default function History() {
  const { workouts, loading } = useWorkoutHistory()
  const { exercises } = useExercises()

  return (
    <div className="px-4 pb-24 pt-[calc(1rem+var(--safe-top))]">
      <h1 className="mb-4 text-2xl font-semibold">History</h1>

      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : workouts.length === 0 ? (
        <p className="text-zinc-500">No completed workouts yet.</p>
      ) : (
        <ul className="mb-8 divide-y divide-zinc-800 rounded-lg bg-zinc-900/50">
          {workouts.map((w) => (
            <li key={w.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {new Date(w.started_at).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                {w.routineName && <span className="text-sm text-zinc-500">{w.routineName}</span>}
              </div>
              <p className="text-sm text-zinc-500">
                {w.setCount} sets · {Math.round(w.volume).toLocaleString()} lb volume
              </p>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-zinc-500">Progress by Exercise</h2>
      {exercises.length === 0 ? (
        <p className="text-zinc-500">Add exercises to start tracking progress.</p>
      ) : (
        <ul className="divide-y divide-zinc-800 rounded-lg bg-zinc-900/50">
          {exercises.map((exercise) => (
            <li key={exercise.id}>
              <Link to={`/exercise/${exercise.id}`} className="block px-4 py-3">
                {exercise.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
