export const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio', 'Other'] as const

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]
