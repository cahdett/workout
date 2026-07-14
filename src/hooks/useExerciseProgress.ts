import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { epley1RM } from './usePersonalRecords'
import type { WorkoutSet } from '../types/database'

export interface ProgressPoint {
  date: string
  workoutId: string
  maxWeight: number
  bestE1RM: number
}

export function useExerciseProgress(exerciseId: string | undefined) {
  const [points, setPoints] = useState<ProgressPoint[]>([])
  const [allSets, setAllSets] = useState<WorkoutSet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!exerciseId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('workout_sets')
        .select('*, workout:workouts(started_at)')
        .eq('exercise_id', exerciseId)
        .order('created_at', { ascending: true })
      if (cancelled) return

      const rows = (data ?? []) as (WorkoutSet & { workout: { started_at: string } | null })[]
      const byWorkout = new Map<string, ProgressPoint>()

      for (const r of rows) {
        const weight = Number(r.weight)
        const reps = Number(r.reps)
        const e1rm = epley1RM(weight, reps)
        const date = r.workout?.started_at ?? r.created_at
        const existing = byWorkout.get(r.workout_id)
        if (!existing) {
          byWorkout.set(r.workout_id, { date, workoutId: r.workout_id, maxWeight: weight, bestE1RM: e1rm })
        } else {
          existing.maxWeight = Math.max(existing.maxWeight, weight)
          existing.bestE1RM = Math.max(existing.bestE1RM, e1rm)
        }
      }

      setPoints(Array.from(byWorkout.values()).sort((a, b) => a.date.localeCompare(b.date)))
      setAllSets(rows.map((r) => ({ ...r, weight: Number(r.weight), reps: Number(r.reps) })))
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [exerciseId])

  return { points, allSets, loading }
}
