import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useExercises } from '../hooks/useExercises'
import { epley1RM, fetchBestE1RM } from '../hooks/usePersonalRecords'
import ExercisePicker from '../components/ExercisePicker'
import SetRow from '../components/SetRow'
import RestTimer from '../components/RestTimer'
import type { Exercise, RoutineExerciseWithName, WorkoutSet } from '../types/database'

const DEFAULT_REST_SECONDS = 90

interface PendingRow {
  id: string
  weightInput: string
  repsInput: string
}

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
  pendingRows: PendingRow[]
  bestE1RM: number
  restSeconds: number
}

function newPendingRow(): PendingRow {
  return { id: crypto.randomUUID(), weightInput: '', repsInput: '' }
}

function formatElapsed(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function ActiveWorkout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const routineIdParam = searchParams.get('routineId') ?? undefined
  const resumeWorkoutId = searchParams.get('workoutId') ?? undefined

  const { exercises, addExercise: createExercise } = useExercises()

  const [workoutId, setWorkoutId] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [sessionExercises, setSessionExercises] = useState<SessionExercise[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [restState, setRestState] = useState<{ key: number; seconds: number } | null>(null)
  const [notifStatus, setNotifStatus] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  )
  const [elapsed, setElapsed] = useState(0)

  const initRef = useRef(false)

  // Elapsed time ticks off the DB's started_at timestamp, so it's correct even
  // after backgrounding the tab or resuming a workout later.
  useEffect(() => {
    if (!startedAt) return
    const start = new Date(startedAt).getTime()
    function tick() {
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  // Create a new workout, or resume an existing one (fetch its sets + linked routine's targets).
  useEffect(() => {
    if (initRef.current || !user) return
    initRef.current = true

    async function init() {
      let workoutRow: { id: string; started_at: string; routine_id: string | null }
      const sessionMap = new Map<string, SessionExercise>()

      if (resumeWorkoutId) {
        const { data: workout } = await supabase.from('workouts').select('*').eq('id', resumeWorkoutId).single()
        if (!workout) {
          navigate('/')
          return
        }
        workoutRow = workout

        const { data: setRows } = await supabase
          .from('workout_sets')
          .select('*, exercise:exercises(id, name)')
          .eq('workout_id', workout.id)
          .order('set_number', { ascending: true })

        for (const row of (setRows ?? []) as (WorkoutSet & { exercise: Pick<Exercise, 'id' | 'name'> })[]) {
          const sessionSet: SessionSet = {
            id: row.id,
            setNumber: row.set_number,
            weight: Number(row.weight),
            reps: Number(row.reps),
            isPR: false,
          }
          const existing = sessionMap.get(row.exercise_id)
          if (existing) existing.sets.push(sessionSet)
          else
            sessionMap.set(row.exercise_id, {
              exerciseId: row.exercise_id,
              name: row.exercise.name,
              sets: [sessionSet],
              pendingRows: [],
              bestE1RM: 0,
              restSeconds: DEFAULT_REST_SECONDS,
            })
        }
      } else {
        const { data } = await supabase
          .from('workouts')
          .insert({ user_id: user!.id, routine_id: routineIdParam ?? null })
          .select()
          .single()
        if (!data) return
        workoutRow = data
      }

      setWorkoutId(workoutRow.id)
      setStartedAt(workoutRow.started_at)

      if (workoutRow.routine_id) {
        const { data: routineItems } = await supabase
          .from('routine_exercises')
          .select('*, exercise:exercises(id, name)')
          .eq('routine_id', workoutRow.routine_id)
          .order('order_index', { ascending: true })

        for (const item of (routineItems ?? []) as RoutineExerciseWithName[]) {
          const targetSlots = Math.max(1, item.target_sets ?? 1)
          const existing = sessionMap.get(item.exercise.id)
          if (existing) {
            const shortBy = Math.max(0, targetSlots - existing.sets.length)
            existing.pendingRows = Array.from({ length: shortBy }, () => newPendingRow())
            existing.restSeconds = item.rest_seconds ?? existing.restSeconds
          } else {
            sessionMap.set(item.exercise.id, {
              exerciseId: item.exercise.id,
              name: item.exercise.name,
              sets: [],
              pendingRows: Array.from({ length: targetSlots }, () => newPendingRow()),
              bestE1RM: 0,
              restSeconds: item.rest_seconds ?? DEFAULT_REST_SECONDS,
            })
          }
        }
      }

      const initialExercises = Array.from(sessionMap.values())
      setSessionExercises(initialExercises)

      initialExercises.forEach((ex) => {
        fetchBestE1RM(ex.exerciseId).then((best) => {
          setSessionExercises((prev) => prev.map((e) => (e.exerciseId === ex.exerciseId ? { ...e, bestE1RM: best } : e)))
        })
      })
    }

    init()
  }, [user, resumeWorkoutId, routineIdParam, navigate])

  async function addExerciseToSession(exercise: Pick<Exercise, 'id' | 'name'>) {
    setSessionExercises((prev) => {
      if (prev.some((e) => e.exerciseId === exercise.id)) return prev
      return [
        ...prev,
        {
          exerciseId: exercise.id,
          name: exercise.name,
          sets: [],
          pendingRows: [newPendingRow()],
          bestE1RM: 0,
          restSeconds: DEFAULT_REST_SECONDS,
        },
      ]
    })
    const best = await fetchBestE1RM(exercise.id)
    setSessionExercises((prev) => prev.map((e) => (e.exerciseId === exercise.id ? { ...e, bestE1RM: best } : e)))
  }

  function updatePendingInput(exIdx: number, rowId: string, field: 'weightInput' | 'repsInput', value: string) {
    setSessionExercises((prev) =>
      prev.map((e, i) =>
        i === exIdx ? { ...e, pendingRows: e.pendingRows.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)) } : e
      )
    )
  }

  function addPendingRow(exIdx: number) {
    setSessionExercises((prev) => prev.map((e, i) => (i === exIdx ? { ...e, pendingRows: [...e.pendingRows, newPendingRow()] } : e)))
  }

  function updateRestSeconds(exIdx: number, value: number) {
    setSessionExercises((prev) => prev.map((e, i) => (i === exIdx ? { ...e, restSeconds: value } : e)))
  }

  async function logPendingRow(exIdx: number, rowId: string) {
    const ex = sessionExercises[exIdx]
    const row = ex.pendingRows.find((r) => r.id === rowId)
    if (!row || !workoutId) return
    const weight = parseFloat(row.weightInput)
    const reps = parseInt(row.repsInput, 10)
    if (Number.isNaN(weight) || Number.isNaN(reps) || weight < 0 || reps <= 0) return

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
              pendingRows: e.pendingRows.filter((r) => r.id !== rowId),
              bestE1RM: isPR ? e1rm : e.bestE1RM,
            }
          : e
      )
    )
    setRestState({ key: Date.now(), seconds: ex.restSeconds })
  }

  async function finishWorkout() {
    if (workoutId) {
      await supabase.from('workouts').update({ ended_at: new Date().toISOString() }).eq('id', workoutId)
    }
    navigate('/history')
  }

  async function exitWorkout() {
    if (workoutId) {
      const isEmpty = sessionExercises.every((e) => e.sets.length === 0)
      if (isEmpty) {
        // Nothing was ever logged — clean up rather than leaving a phantom in-progress workout.
        await supabase.from('workouts').delete().eq('id', workoutId)
      }
      // Otherwise leave ended_at untouched so the workout stays resumable from Home.
    }
    navigate('/')
  }

  async function requestNotifications() {
    if (typeof Notification === 'undefined') return
    const permission = await Notification.requestPermission()
    setNotifStatus(permission)
  }

  return (
    <div className="px-4 pb-32 pt-[calc(1rem+var(--safe-top))]">
      <div className="mb-1 flex items-center justify-between">
        <button onClick={exitWorkout} className="text-sm text-zinc-400">
          ← Exit
        </button>
        <h1 className="font-mono text-lg tabular-nums">{formatElapsed(elapsed)}</h1>
        <button onClick={finishWorkout} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium">
          Finish
        </button>
      </div>

      {notifStatus === 'default' && (
        <button onClick={requestNotifications} className="mb-2 text-xs text-indigo-400 underline">
          🔔 Enable rest-timer alerts
        </button>
      )}

      <div className="mt-3 space-y-4">
        {sessionExercises.map((ex, idx) => (
          <div key={ex.exerciseId} className="rounded-lg bg-zinc-900/50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-medium">{ex.name}</h2>
              <label className="flex items-center gap-1 text-xs text-zinc-500">
                Rest
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={ex.restSeconds}
                  onChange={(e) => updateRestSeconds(idx, Number(e.target.value) || 0)}
                  className="w-14 rounded bg-zinc-800 px-1 py-0.5 text-center outline-none"
                />
                s
              </label>
            </div>

            {ex.sets.length > 0 && (
              <div className="mb-2 space-y-1">
                {ex.sets.map((s) => (
                  <SetRow key={s.id} setNumber={s.setNumber} weight={s.weight} reps={s.reps} isPR={s.isPR} />
                ))}
              </div>
            )}

            <div className="space-y-2">
              {ex.pendingRows.map((row, rowIdx) => (
                <div key={row.id} className="flex items-center gap-2">
                  <span className="w-12 shrink-0 text-sm text-zinc-500">Set {ex.sets.length + rowIdx + 1}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="Weight"
                    value={row.weightInput}
                    onChange={(e) => updatePendingInput(idx, row.id, 'weightInput', e.target.value)}
                    className="w-20 rounded bg-zinc-800 px-3 py-2 text-center outline-none placeholder:text-zinc-500"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Reps"
                    value={row.repsInput}
                    onChange={(e) => updatePendingInput(idx, row.id, 'repsInput', e.target.value)}
                    className="w-20 rounded bg-zinc-800 px-3 py-2 text-center outline-none placeholder:text-zinc-500"
                  />
                  <button
                    onClick={() => logPendingRow(idx, row.id)}
                    className="flex-1 rounded bg-indigo-600 py-2 font-medium active:bg-indigo-500"
                  >
                    Log
                  </button>
                </div>
              ))}
            </div>

            <button onClick={() => addPendingRow(idx)} className="mt-2 text-sm text-zinc-500">
              + Add Set
            </button>
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

      {restState && (
        <RestTimer
          key={restState.key}
          seconds={restState.seconds}
          notify={notifStatus === 'granted'}
          onDismiss={() => setRestState(null)}
        />
      )}
    </div>
  )
}
