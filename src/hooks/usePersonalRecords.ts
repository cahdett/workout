import { supabase } from '../lib/supabaseClient'

export function epley1RM(weight: number, reps: number): number {
  return weight * (1 + reps / 30)
}

export async function fetchBestE1RM(exerciseId: string): Promise<number> {
  const { data } = await supabase.from('workout_sets').select('weight, reps').eq('exercise_id', exerciseId)
  return (data ?? []).reduce((max, s) => Math.max(max, epley1RM(Number(s.weight), Number(s.reps))), 0)
}

export interface LastSessionSet {
  weight: number
  reps: number
}

/** All sets logged for this exercise in its most recent workout, excluding the given (usually in-progress) workout. */
export async function fetchLastSessionSets(exerciseId: string, excludeWorkoutId?: string): Promise<LastSessionSet[] | null> {
  const { data: recentRows } = await supabase
    .from('workout_sets')
    .select('workout_id, created_at')
    .eq('exercise_id', exerciseId)
    .order('created_at', { ascending: false })
    .limit(50)

  const lastWorkoutId = (recentRows ?? []).find((r) => r.workout_id !== excludeWorkoutId)?.workout_id
  if (!lastWorkoutId) return null

  const { data: sets } = await supabase
    .from('workout_sets')
    .select('weight, reps, set_number')
    .eq('workout_id', lastWorkoutId)
    .eq('exercise_id', exerciseId)
    .order('set_number', { ascending: true })

  return (sets ?? []).map((s) => ({ weight: Number(s.weight), reps: Number(s.reps) }))
}

export function formatLastSession(sets: LastSessionSet[]): string | null {
  if (sets.length === 0) return null
  const sameWeight = sets.every((s) => s.weight === sets[0].weight)
  const sameReps = sets.every((s) => s.reps === sets[0].reps)

  if (sameWeight && sameReps) return `Last: ${sets.length} × ${sets[0].reps} @ ${sets[0].weight}`
  if (sameWeight) return `Last: ${sets.map((s) => s.reps).join(', ')} @ ${sets[0].weight}`
  return `Last: ${sets.map((s) => `${s.reps} @ ${s.weight}`).join(', ')}`
}
