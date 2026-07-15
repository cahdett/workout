export interface Exercise {
  id: string
  user_id: string
  name: string
  muscle_group: string | null
  muscle_subgroup: string | null
  created_at: string
}

export interface Routine {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface RoutineExercise {
  id: string
  routine_id: string
  exercise_id: string
  order_index: number
  target_sets: number | null
  target_reps: number | null
  rest_seconds: number | null
}

export interface RoutineExerciseWithName extends RoutineExercise {
  exercise: Pick<Exercise, 'id' | 'name'>
}

export interface Workout {
  id: string
  user_id: string
  routine_id: string | null
  started_at: string
  ended_at: string | null
  notes: string | null
}

export interface WorkoutSet {
  id: string
  workout_id: string
  exercise_id: string
  set_number: number
  weight: number
  reps: number
  created_at: string
}

export interface BodyWeightLog {
  id: string
  user_id: string
  logged_date: string
  weight: number
  created_at: string
}
