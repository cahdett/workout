import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { RoutineExerciseWithName } from '../types/database'

export function useRoutineExercises(routineId: string | undefined) {
  const [items, setItems] = useState<RoutineExerciseWithName[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!routineId) return
    setLoading(true)
    const { data } = await supabase
      .from('routine_exercises')
      .select('*, exercise:exercises(id, name)')
      .eq('routine_id', routineId)
      .order('order_index', { ascending: true })
    setItems((data as unknown as RoutineExerciseWithName[]) ?? [])
    setLoading(false)
  }, [routineId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function addExercise(exerciseId: string) {
    if (!routineId) return
    const nextIndex = items.length
    const { data } = await supabase
      .from('routine_exercises')
      .insert({ routine_id: routineId, exercise_id: exerciseId, order_index: nextIndex })
      .select('*, exercise:exercises(id, name)')
      .single()
    if (data) setItems((prev) => [...prev, data as unknown as RoutineExerciseWithName])
  }

  async function removeExercise(id: string) {
    await supabase.from('routine_exercises').delete().eq('id', id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  async function updateTargets(id: string, targetSets: number | null, targetReps: number | null) {
    await supabase.from('routine_exercises').update({ target_sets: targetSets, target_reps: targetReps }).eq('id', id)
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, target_sets: targetSets, target_reps: targetReps } : i)))
  }

  async function move(id: string, direction: -1 | 1) {
    const idx = items.findIndex((i) => i.id === id)
    const swapIdx = idx + direction
    if (idx < 0 || swapIdx < 0 || swapIdx >= items.length) return
    const reordered = [...items]
    ;[reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]]
    setItems(reordered)
    await Promise.all(
      reordered.map((item, i) => supabase.from('routine_exercises').update({ order_index: i }).eq('id', item.id))
    )
  }

  return { items, loading, addExercise, removeExercise, updateTargets, move }
}
