export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quad',
  'Hamstring',
  'Adductor',
  'Calves',
  'Glute',
  'Core',
  'Cardio',
  'Other',
] as const

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]
