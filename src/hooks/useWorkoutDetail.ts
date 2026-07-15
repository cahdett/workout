import { useCallback, useEffect, useState } from 'react'
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

  const refresh = useCallback(async () => {
    if (!workoutId) return
    setLoading(true)
    const [{ data: workoutRow }, { data: setRows }] = await Promise.all([
      supabase.from('workouts').select('*, routine:routines(name)').eq('id', workoutId).single(),
      supabase
        .from('workout_sets')
        .select('*, exercise:exercises(id, name)')
        .eq('workout_id', workoutId)
        .order('set_number', { ascending: true }),
    ])

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
  }, [workoutId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function updateSet(setId: string, weight: number, reps: number) {
    const { error } = await supabase.from('workout_sets').update({ weight, reps }).eq('id', setId)
    if (error) return
    setExerciseGroups((prev) =>
      prev.map((g) => ({ ...g, sets: g.sets.map((s) => (s.id === setId ? { ...s, weight, reps } : s)) }))
    )
  }

  async function deleteSet(setId: string) {
    const { error } = await supabase.from('workout_sets').delete().eq('id', setId)
    if (error) return
    setExerciseGroups((prev) =>
      prev.map((g) => ({ ...g, sets: g.sets.filter((s) => s.id !== setId) })).filter((g) => g.sets.length > 0)
    )
  }

  async function addSet(exerciseId: string, exerciseName: string, weight: number, reps: number) {
    if (!workoutId) return
    const group = exerciseGroups.find((g) => g.exerciseId === exerciseId)
    const setNumber = (group?.sets.length ?? 0) + 1
    const { data, error } = await supabase
      .from('workout_sets')
      .insert({ workout_id: workoutId, exercise_id: exerciseId, set_number: setNumber, weight, reps })
      .select()
      .single()
    if (error || !data) return
    const set: WorkoutSet = { ...data, weight: Number(data.weight), reps: Number(data.reps) }
    setExerciseGroups((prev) => {
      if (prev.some((g) => g.exerciseId === exerciseId)) {
        return prev.map((g) => (g.exerciseId === exerciseId ? { ...g, sets: [...g.sets, set] } : g))
      }
      return [...prev, { exerciseId, name: exerciseName, sets: [set] }]
    })
  }

  async function removeExercise(exerciseId: string) {
    if (!workoutId) return
    const { error } = await supabase.from('workout_sets').delete().eq('workout_id', workoutId).eq('exercise_id', exerciseId)
    if (error) return
    setExerciseGroups((prev) => prev.filter((g) => g.exerciseId !== exerciseId))
  }

  return { workout, exerciseGroups, loading, updateSet, deleteSet, addSet, removeExercise, refresh }
}
