import { useEffect, useState } from 'react'
import { useExercises } from './useExercises'
import { fetchExerciseProgress } from './useExerciseProgress'

const PLATEAU_THRESHOLD_SESSIONS = 3

export type ProgressionTrend = 'improving' | 'plateaued' | 'insufficient-data'

export interface ExerciseProgressSummary {
  exerciseId: string
  name: string
  muscleGroup: string | null
  muscleSubgroup: string | null
  sessionsCount: number
  lastSessionDate: string | null
  bestE1RM: number
  trend: ProgressionTrend
  sessionsSinceNewBest: number
}

export function useProgressionReport() {
  const { exercises, loading: exercisesLoading } = useExercises()
  const [summaries, setSummaries] = useState<ExerciseProgressSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (exercisesLoading) return
    if (exercises.length === 0) {
      setSummaries([])
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      const results = await Promise.all(
        exercises.map(async (ex): Promise<ExerciseProgressSummary> => {
          const { points } = await fetchExerciseProgress(ex.id)

          if (points.length === 0) {
            return {
              exerciseId: ex.id,
              name: ex.name,
              muscleGroup: ex.muscle_group,
              muscleSubgroup: ex.muscle_subgroup,
              sessionsCount: 0,
              lastSessionDate: null,
              bestE1RM: 0,
              trend: 'insufficient-data',
              sessionsSinceNewBest: 0,
            }
          }

          let runningBest = 0
          let sessionsSinceNewBest = 0
          for (const p of points) {
            if (p.bestE1RM > runningBest) {
              runningBest = p.bestE1RM
              sessionsSinceNewBest = 0
            } else {
              sessionsSinceNewBest += 1
            }
          }

          const trend: ProgressionTrend =
            points.length < 2
              ? 'insufficient-data'
              : sessionsSinceNewBest >= PLATEAU_THRESHOLD_SESSIONS
                ? 'plateaued'
                : 'improving'

          return {
            exerciseId: ex.id,
            name: ex.name,
            muscleGroup: ex.muscle_group,
            muscleSubgroup: ex.muscle_subgroup,
            sessionsCount: points.length,
            lastSessionDate: points[points.length - 1].date,
            bestE1RM: runningBest,
            trend,
            sessionsSinceNewBest,
          }
        })
      )

      if (!cancelled) {
        setSummaries(results)
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [exercises, exercisesLoading])

  return { summaries, loading }
}
