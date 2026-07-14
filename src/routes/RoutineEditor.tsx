import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRoutines } from '../hooks/useRoutines'
import { useRoutineExercises } from '../hooks/useRoutineExercises'
import { useExercises } from '../hooks/useExercises'
import ExercisePicker from '../components/ExercisePicker'

export default function RoutineEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { routines, renameRoutine } = useRoutines()
  const { items, loading, addExercise, removeExercise, updateTargets, move } = useRoutineExercises(id)
  const { exercises, addExercise: createExercise } = useExercises()
  const [pickerOpen, setPickerOpen] = useState(false)

  const routine = routines.find((r) => r.id === id)

  return (
    <div className="px-4 pb-24 pt-[calc(1rem+var(--safe-top))]">
      <button onClick={() => navigate('/routines')} className="mb-3 text-sm text-zinc-400">
        ← Routines
      </button>

      <input
        defaultValue={routine?.name ?? ''}
        onBlur={(e) => id && renameRoutine(id, e.target.value)}
        className="mb-4 w-full rounded-lg bg-zinc-900 px-4 py-3 text-xl font-semibold outline-none"
      />

      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {items.map((item, idx) => (
            <li key={item.id} className="rounded-lg bg-zinc-900/50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">{item.exercise.name}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => move(item.id, -1)}
                    disabled={idx === 0}
                    className="text-zinc-400 disabled:opacity-20"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(item.id, 1)}
                    disabled={idx === items.length - 1}
                    className="text-zinc-400 disabled:opacity-20"
                  >
                    ↓
                  </button>
                  <button onClick={() => removeExercise(item.id)} className="text-sm text-red-400">
                    Remove
                  </button>
                </div>
              </div>
              <div className="flex gap-2 text-sm">
                <label className="flex items-center gap-1 text-zinc-400">
                  Sets
                  <input
                    type="number"
                    min={0}
                    defaultValue={item.target_sets ?? ''}
                    onBlur={(e) =>
                      updateTargets(item.id, e.target.value ? Number(e.target.value) : null, item.target_reps)
                    }
                    className="w-14 rounded bg-zinc-800 px-2 py-1 outline-none"
                  />
                </label>
                <label className="flex items-center gap-1 text-zinc-400">
                  Reps
                  <input
                    type="number"
                    min={0}
                    defaultValue={item.target_reps ?? ''}
                    onBlur={(e) =>
                      updateTargets(item.id, item.target_sets, e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-14 rounded bg-zinc-800 px-2 py-1 outline-none"
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => setPickerOpen(true)}
        className="w-full rounded-lg border border-dashed border-zinc-700 py-3 text-zinc-400"
      >
        + Add Exercise
      </button>

      {id && (
        <button
          onClick={() => navigate(`/workout/active?routineId=${id}`)}
          className="mt-4 w-full rounded-lg bg-indigo-600 py-3 font-medium"
        >
          Start This Workout
        </button>
      )}

      {pickerOpen && (
        <ExercisePicker
          exercises={exercises}
          onCreate={createExercise}
          onClose={() => setPickerOpen(false)}
          onSelect={(exercise) => {
            addExercise(exercise.id)
            setPickerOpen(false)
          }}
        />
      )}
    </div>
  )
}
