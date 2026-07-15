import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Exercise, Workout, WorkoutSet } from '../types/database'

export interface WorkoutDetailExercise {
  exerciseId: string
  name: string
  sets: WorkoutSet[]
}

export function useWorkoutDetail(workoutId: string | undefined) {
  const [workout, setWorkout] = useState<(Workout & { routineName: string | null }) | null>(null)
  const [exerciseGroups, setExerciseGroups] = useState<WorkoutDetailExercise[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workoutId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const [{ data: workoutRow }, { data: setRows }] = await Promise.all([
        supabase.from('workouts').select('*, routine:routines(name)').eq('id', workoutId).single(),
        supabase
          .from('workout_sets')
          .select('*, exercise:exercises(id, name)')
          .eq('workout_id', workoutId)
          .order('set_number', { ascending: true }),
      ])
      if (cancelled) return

      const grouped = new Map<string, WorkoutDetailExercise>()
      for (const row of (setRows ?? []) as (WorkoutSet & { exercise: Pick<Exercise, 'id' | 'name'> })[]) {
        const set: WorkoutSet = { ...row, weight: Number(row.weight), reps: Number(row.reps) }
        const existing = grouped.get(row.exercise_id)
        if (existing) existing.sets.push(set)
        else grouped.set(row.exercise_id, { exerciseId: row.exercise_id, name: row.exercise.name, sets: [set] })
      }

      const routine = (workoutRow as (Workout & { routine: { name: string } | null }) | null)?.routine ?? null
      setWorkout(workoutRow ? { ...workoutRow, routineName: routine?.name ?? null } : null)
      setExerciseGroups(Array.from(grouped.values()))
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [workoutId])

  return { workout, exerciseGroups, loading }
}
