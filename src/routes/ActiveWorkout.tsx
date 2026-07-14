import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useExercises } from '../hooks/useExercises'
import { useRoutineExercises } from '../hooks/useRoutineExercises'
import { epley1RM, fetchBestE1RM } from '../hooks/usePersonalRecords'
import ExercisePicker from '../components/ExercisePicker'
import SetRow from '../components/SetRow'
import RestTimer from '../components/RestTimer'
import type { Exercise } from '../types/database'

const DEFAULT_REST_SECONDS = 90

interface SessionSet {
  id: string
  setNumber: number
  weight: number
  reps: number
  isPR: boolean
}

interface SessionExercise {
  exerciseId: string
  name: string
  sets: SessionSet[]
  bestE1RM: number
  weightInput: string
  repsInput: string
}

export default function ActiveWorkout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const routineId = searchParams.get('routineId') ?? undefined

  const { exercises, addExercise: createExercise } = useExercises()
  const { items: routineItems } = useRoutineExercises(routineId)

  const [workoutId, setWorkoutId] = useState<string | null>(null)
  const [sessionExercises, setSessionExercises] = useState<SessionExercise[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [restTrigger, setRestTrigger] = useState<number | null>(null)

  const workoutCreatedRef = useRef(false)
  const seededRef = useRef(false)

  useEffect(() => {
    if (workoutCreatedRef.current || !user) return
    workoutCreatedRef.current = true
    supabase
      .from('workouts')
      .insert({ user_id: user.id, routine_id: routineId ?? null })
      .select()
      .single()
      .then(({ data }) => {
        if (data) setWorkoutId(data.id)
      })
  }, [user, routineId])

  async function addExerciseToSession(exercise: Pick<Exercise, 'id' | 'name'>) {
    setSessionExercises((prev) => {
      if (prev.some((e) => e.exerciseId === exercise.id)) return prev
      return [...prev, { exerciseId: exercise.id, name: exercise.name, sets: [], bestE1RM: 0, weightInput: '', repsInput: '' }]
    })
    const best = await fetchBestE1RM(exercise.id)
    setSessionExercises((prev) => prev.map((e) => (e.exerciseId === exercise.id ? { ...e, bestE1RM: best } : e)))
  }

  useEffect(() => {
    if (seededRef.current || routineItems.length === 0) return
    seededRef.current = true
    routineItems.forEach((item) => addExerciseToSession(item.exercise))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routineItems])

  function updateInput(exIdx: number, field: 'weightInput' | 'repsInput', value: string) {
    setSessionExercises((prev) => prev.map((e, i) => (i === exIdx ? { ...e, [field]: value } : e)))
  }

  async function logSet(exIdx: number) {
    const ex = sessionExercises[exIdx]
    const weight = parseFloat(ex.weightInput)
    const reps = parseInt(ex.repsInput, 10)
    if (!workoutId || Number.isNaN(weight) || Number.isNaN(reps) || weight < 0 || reps <= 0) return

    const setNumber = ex.sets.length + 1
    const { data } = await supabase
      .from('workout_sets')
      .insert({ workout_id: workoutId, exercise_id: ex.exerciseId, set_number: setNumber, weight, reps })
      .select()
      .single()
    if (!data) return

    const e1rm = epley1RM(weight, reps)
    const isPR = e1rm > ex.bestE1RM

    setSessionExercises((prev) =>
      prev.map((e, i) =>
        i === exIdx
          ? {
              ...e,
              sets: [...e.sets, { id: data.id, setNumber, weight, reps, isPR }],
              bestE1RM: isPR ? e1rm : e.bestE1RM,
            }
          : e
      )
    )
    setRestTrigger(Date.now())
  }

  async function finishWorkout() {
    if (workoutId) {
      await supabase.from('workouts').update({ ended_at: new Date().toISOString() }).eq('id', workoutId)
    }
    navigate('/history')
  }

  async function cancelWorkout() {
    if (workoutId) {
      const isEmpty = sessionExercises.every((e) => e.sets.length === 0)
      if (isEmpty) await supabase.from('workouts').delete().eq('id', workoutId)
      else await supabase.from('workouts').update({ ended_at: new Date().toISOString() }).eq('id', workoutId)
    }
    navigate('/')
  }

  return (
    <div className="px-4 pb-32 pt-[calc(1rem+var(--safe-top))]">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={cancelWorkout} className="text-sm text-zinc-400">
          ← Exit
        </button>
        <h1 className="text-lg font-semibold">Workout</h1>
        <button onClick={finishWorkout} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium">
          Finish
        </button>
      </div>

      <div className="space-y-4">
        {sessionExercises.map((ex, idx) => (
          <div key={ex.exerciseId} className="rounded-lg bg-zinc-900/50 p-3">
            <h2 className="mb-2 font-medium">{ex.name}</h2>

            {ex.sets.length > 0 && (
              <div className="mb-2 space-y-1">
                {ex.sets.map((s) => (
                  <SetRow key={s.id} setNumber={s.setNumber} weight={s.weight} reps={s.reps} isPR={s.isPR} />
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Weight"
                value={ex.weightInput}
                onChange={(e) => updateInput(idx, 'weightInput', e.target.value)}
                className="w-20 rounded bg-zinc-800 px-3 py-2 text-center outline-none placeholder:text-zinc-500"
              />
              <input
                type="number"
                inputMode="numeric"
                placeholder="Reps"
                value={ex.repsInput}
                onChange={(e) => updateInput(idx, 'repsInput', e.target.value)}
                className="w-20 rounded bg-zinc-800 px-3 py-2 text-center outline-none placeholder:text-zinc-500"
              />
              <button
                onClick={() => logSet(idx)}
                className="flex-1 rounded bg-indigo-600 py-2 font-medium active:bg-indigo-500"
              >
                Log Set
              </button>
            </div>
          </div>
        ))}
      </div>

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
            addExerciseToSession(exercise)
            setPickerOpen(false)
          }}
        />
      )}

      {restTrigger !== null && (
        <RestTimer key={restTrigger} seconds={DEFAULT_REST_SECONDS} onDismiss={() => setRestTrigger(null)} />
      )}
    </div>
  )
}
