import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import type { Workout } from '../types/database'

export interface WorkoutSummary extends Workout {
  routineName: string | null
  setCount: number
  volume: number
}

export function useWorkoutHistory() {
  const { user } = useAuth()
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const { data: workoutRows } = await supabase
        .from('workouts')
        .select('*, routine:routines(name)')
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: false })

      const rows = (workoutRows ?? []) as (Workout & { routine: { name: string } | null })[]
      const ids = rows.map((w) => w.id)

      const setsByWorkout = new Map<string, { count: number; volume: number }>()
      if (ids.length > 0) {
        const { data: setRows } = await supabase.from('workout_sets').select('workout_id, weight, reps').in('workout_id', ids)
        for (const s of setRows ?? []) {
          const bucket = setsByWorkout.get(s.workout_id) ?? { count: 0, volume: 0 }
          bucket.count += 1
          bucket.volume += Number(s.weight) * Number(s.reps)
          setsByWorkout.set(s.workout_id, bucket)
        }
      }

      if (!cancelled) {
        setWorkouts(
          rows.map((w) => ({
            ...w,
            routineName: w.routine?.name ?? null,
            setCount: setsByWorkout.get(w.id)?.count ?? 0,
            volume: setsByWorkout.get(w.id)?.volume ?? 0,
          }))
        )
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user])

  async function deleteWorkout(id: string) {
    const { error } = await supabase.from('workouts').delete().eq('id', id)
    if (error) return
    setWorkouts((prev) => prev.filter((w) => w.id !== id))
  }

  return { workouts, loading, deleteWorkout }
}
