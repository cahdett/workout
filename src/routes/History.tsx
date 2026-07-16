import { Link } from 'react-router-dom'
import { useWorkoutHistory } from '../hooks/useWorkoutHistory'
import WorkoutHeatmap from '../components/WorkoutHeatmap'
import { uniqueLocalDates } from '../lib/date'

export default function History() {
  const { workouts, loading, deleteWorkout } = useWorkoutHistory()

  return (
    <div className="px-4 pb-24 pt-[calc(1rem+var(--safe-top))]">
      <h1 className="mb-4 text-2xl font-semibold">History</h1>

      {!loading && workouts.length > 0 && (
        <div className="mb-6 rounded-lg bg-zinc-900/50 p-3">
          <WorkoutHeatmap workoutDates={uniqueLocalDates(workouts.map((w) => w.started_at))} />
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : workouts.length === 0 ? (
        <p className="text-zinc-500">No completed workouts yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-800 rounded-lg bg-zinc-900/50">
          {workouts.map((w) => (
            <li key={w.id} className="flex items-center justify-between px-4 py-3">
              <Link to={`/history/${w.id}`} className="flex-1">
                <div className="flex items-center gap-2">
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
              </Link>
              <button
                onClick={() => {
                  if (confirm('Delete this workout? This cannot be undone.')) deleteWorkout(w.id)
                }}
                className="text-sm text-red-400"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
