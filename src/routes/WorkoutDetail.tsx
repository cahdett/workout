import { useNavigate, useParams } from 'react-router-dom'
import { useWorkoutDetail } from '../hooks/useWorkoutDetail'
import SetRow from '../components/SetRow'

export default function WorkoutDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { workout, exerciseGroups, loading } = useWorkoutDetail(id)

  const durationMinutes =
    workout?.started_at && workout?.ended_at
      ? Math.round((new Date(workout.ended_at).getTime() - new Date(workout.started_at).getTime()) / 60000)
      : null

  return (
    <div className="px-4 pb-24 pt-[calc(1rem+var(--safe-top))]">
      <button onClick={() => navigate('/history')} className="mb-3 text-sm text-zinc-400">
        ← History
      </button>

      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : !workout ? (
        <p className="text-zinc-500">Workout not found.</p>
      ) : (
        <>
          <h1 className="text-2xl font-semibold">
            {new Date(workout.started_at).toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </h1>
          <p className="mb-4 text-sm text-zinc-500">
            {workout.routineName ?? 'Freeform workout'}
            {durationMinutes !== null && ` · ${durationMinutes} min`}
          </p>

          {exerciseGroups.length === 0 ? (
            <p className="text-zinc-500">No sets were logged in this workout.</p>
          ) : (
            <div className="space-y-4">
              {exerciseGroups.map((ex) => (
                <div key={ex.exerciseId} className="rounded-lg bg-zinc-900/50 p-3">
                  <h2 className="mb-2 font-medium">{ex.name}</h2>
                  <div className="space-y-1">
                    {ex.sets.map((s) => (
                      <SetRow key={s.id} setNumber={s.set_number} weight={s.weight} reps={s.reps} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
