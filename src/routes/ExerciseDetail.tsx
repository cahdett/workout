import { useParams, useNavigate } from 'react-router-dom'
import { useExercises } from '../hooks/useExercises'
import { useExerciseProgress } from '../hooks/useExerciseProgress'
import { epley1RM } from '../hooks/usePersonalRecords'
import ProgressChart from '../components/ProgressChart'
import SetRow from '../components/SetRow'

export default function ExerciseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { exercises } = useExercises()
  const { points, allSets, loading } = useExerciseProgress(id)
  const exercise = exercises.find((e) => e.id === id)

  const bestE1RM = points.reduce((max, p) => Math.max(max, p.bestE1RM), 0)

  let runningMax = 0
  const setsWithPR = allSets.map((s) => {
    const e1rm = epley1RM(s.weight, s.reps)
    const isPR = e1rm > runningMax
    if (isPR) runningMax = e1rm
    return { ...s, isPR }
  })

  return (
    <div className="px-4 pb-24 pt-[calc(1rem+var(--safe-top))]">
      <button onClick={() => navigate(-1)} className="mb-3 text-sm text-zinc-400">
        ← Back
      </button>
      <h1 className="mb-1 text-2xl font-semibold">{exercise?.name ?? 'Exercise'}</h1>
      <p className="mb-4 text-sm text-zinc-500">Estimated 1-rep max, best set per workout</p>

      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : points.length === 0 ? (
        <p className="text-zinc-500">No logged sets yet for this exercise.</p>
      ) : (
        <>
          <div className="mb-4 rounded-lg bg-zinc-900/50 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Best Est. 1RM</p>
            <p className="text-3xl font-semibold">{Math.round(bestE1RM)} lb</p>
          </div>
          <div className="mb-6 rounded-lg bg-zinc-900/50 p-3">
            <ProgressChart data={points} />
          </div>
        </>
      )}

      <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-zinc-500">History</h2>
      <div className="space-y-1">
        {[...setsWithPR].reverse().map((s) => (
          <SetRow key={s.id} setNumber={s.set_number} weight={s.weight} reps={s.reps} isPR={s.isPR} />
        ))}
      </div>
    </div>
  )
}
