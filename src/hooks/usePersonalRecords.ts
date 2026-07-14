import { supabase } from '../lib/supabaseClient'

export function epley1RM(weight: number, reps: number): number {
  return weight * (1 + reps / 30)
}

export async function fetchBestE1RM(exerciseId: string): Promise<number> {
  const { data } = await supabase.from('workout_sets').select('weight, reps').eq('exercise_id', exerciseId)
  return (data ?? []).reduce((max, s) => Math.max(max, epley1RM(Number(s.weight), Number(s.reps))), 0)
}
