import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useWorkoutDetail } from '../hooks/useWorkoutDetail'
import { useExercises } from '../hooks/useExercises'
import ExercisePicker from '../components/ExercisePicker'
import type { Exercise } from '../types/database'

function EditableSetRow({
  setNumber,
  initialWeight,
  initialReps,
  onSave,
  onDelete,
}: {
  setNumber: number
  initialWeight: number
  initialReps: number
  onSave: (weight: number, reps: number) => void
  onDelete: () => void
}) {
  const [weight, setWeight] = useState(String(initialWeight))
  const [reps, setReps] = useState(String(initialReps))

  function commit() {
    const w = parseFloat(weight)
    const r = parseInt(reps, 10)
    if (!Number.isNaN(w) && !Number.isNaN(r) && w >= 0 && r > 0) onSave(w, r)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-sm text-zinc-500">Set {setNumber}</span>
      <input
        type="number"
        inputMode="decimal"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={commit}
        className="w-20 rounded bg-zinc-800 px-3 py-2 text-center outline-none"
      />
      <input
        type="number"
        inputMode="numeric"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={commit}
        className="w-20 rounded bg-zinc-800 px-3 py-2 text-center outline-none"
      />
      <button onClick={onDelete} className="px-2 text-sm text-red-400">
        ✕
      </button>
    </div>
  )
}

function AddSetRow({ onAdd }: { onAdd: (weight: number, reps: number) => void }) {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')

  function submit() {
    const w = parseFloat(weight)
    const r = parseInt(reps, 10)
    if (Number.isNaN(w) || Number.isNaN(r) || w < 0 || r <= 0) return
    onAdd(w, r)
    setWeight('')
    setReps('')
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        inputMode="decimal"
        placeholder="Weight"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        className="w-20 rounded bg-zinc-800 px-3 py-2 text-center outline-none placeholder:text-zinc-500"
      />
      <input
        type="number"
        inputMode="numeric"
        placeholder="Reps"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        className="w-20 rounded bg-zinc-800 px-3 py-2 text-center outline-none placeholder:text-zinc-500"
      />
      <button onClick={submit} className="flex-1 rounded bg-indigo-600 py-2 font-medium active:bg-indigo-500">
        Add Set
      </button>
    </div>
  )
}

export default function WorkoutDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { workout, exerciseGroups, loading, updateSet, deleteSet, addSet, removeExercise } = useWorkoutDetail(id)
  const { exercises, addExercise: createExercise } = useExercises()

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingNewExercise, setPendingNewExercise] = useState<Pick<Exercise, 'id' | 'name'> | null>(null)

  const durationMinutes =
    workout?.started_at && workout?.ended_at
      ? Math.round((new Date(workout.ended_at).getTime() - new Date(workout.started_at).getTime()) / 60000)
      : null

  return (
    <div className="px-4 pb-24 pt-[calc(1rem+var(--safe-top))]">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => navigate('/history')} className="text-sm text-zinc-400">
          ← History
        </button>
        {workout && (
          <button
            onClick={() => navigate(`/workout/active?repeatWorkoutId=${workout.id}`)}
            className="rounded-lg bg-indigo-600/20 px-3 py-1.5 text-sm text-indigo-300"
          >
            Repeat Workout
          </button>
        )}
      </div>

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

          {exerciseGroups.length === 0 && !pendingNewExercise ? (
            <p className="text-zinc-500">No sets were logged in this workout.</p>
          ) : (
            <div className="space-y-4">
              {exerciseGroups.map((ex) => (
                <div key={ex.exerciseId} className="rounded-lg bg-zinc-900/50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="font-medium">{ex.name}</h2>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${ex.name} and all its sets from this workout?`)) removeExercise(ex.exerciseId)
                      }}
                      className="text-sm text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mb-2 space-y-1">
                    {ex.sets.map((s, idx) => (
                      <EditableSetRow
                        key={s.id}
                        setNumber={idx + 1}
                        initialWeight={s.weight}
                        initialReps={s.reps}
                        onSave={(weight, reps) => updateSet(s.id, weight, reps)}
                        onDelete={() => deleteSet(s.id)}
                      />
                    ))}
                  </div>
                  <AddSetRow onAdd={(weight, reps) => addSet(ex.exerciseId, ex.name, weight, reps)} />
                </div>
              ))}

              {pendingNewExercise && (
                <div className="rounded-lg bg-zinc-900/50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="font-medium">{pendingNewExercise.name}</h2>
                    <button onClick={() => setPendingNewExercise(null)} className="text-sm text-zinc-400">
                      Cancel
                    </button>
                  </div>
                  <AddSetRow
                    onAdd={(weight, reps) => {
                      addSet(pendingNewExercise.id, pendingNewExercise.name, weight, reps)
                      setPendingNewExercise(null)
                    }}
                  />
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setPickerOpen(true)}
            className="mt-4 w-full rounded-lg border border-dashed border-zinc-700 py-3 text-zinc-400"
          >
            + Add Exercise
          </button>

          {pickerOpen && (
            <ExercisePicker
              exercises={exercises}
              onCreate={createExercise}
              onClose={() => setPickerOpen(false)}
              onSelect={(exercise) => {
                if (!exerciseGroups.some((g) => g.exerciseId === exercise.id)) setPendingNewExercise(exercise)
                setPickerOpen(false)
              }}
            />
          )}
        </>
      )}
    </div>
  )
}
