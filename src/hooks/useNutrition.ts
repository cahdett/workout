import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { addDays, startOfWeek } from '../lib/date'
import { useAuth } from '../contexts/AuthContext'
import type { FoodLogWithFood } from '../types/database'

export interface DailyTotals {
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface WeeklyNutritionAverage {
  weekStart: string
  weekEnd: string
  days: number
  avgCalories: number
  avgProtein: number
  avgCarbs: number
  avgFat: number
  deltaCaloriesFromPrevWeek: number | null
}

function scaledMacros(log: FoodLogWithFood) {
  const ratio = log.amount / log.food.serving_size
  return {
    calories: log.food.calories * ratio,
    protein: log.food.protein * ratio,
    carbs: log.food.carbs * ratio,
    fat: log.food.fat * ratio,
  }
}

function computeDailyTotals(logs: FoodLogWithFood[]): DailyTotals[] {
  const totals = new Map<string, DailyTotals>()
  for (const log of logs) {
    const macros = scaledMacros(log)
    const existing = totals.get(log.logged_date) ?? { date: log.logged_date, calories: 0, protein: 0, carbs: 0, fat: 0 }
    existing.calories += macros.calories
    existing.protein += macros.protein
    existing.carbs += macros.carbs
    existing.fat += macros.fat
    totals.set(log.logged_date, existing)
  }
  return [...totals.values()].sort((a, b) => a.date.localeCompare(b.date))
}

function computeWeeklyAverages(dailyTotals: DailyTotals[]): WeeklyNutritionAverage[] {
  const buckets = new Map<string, DailyTotals[]>()
  for (const day of dailyTotals) {
    const weekStart = startOfWeek(day.date)
    const bucket = buckets.get(weekStart) ?? []
    bucket.push(day)
    buckets.set(weekStart, bucket)
  }

  const weeks = [...buckets.keys()].sort()
  const results: WeeklyNutritionAverage[] = weeks.map((weekStart) => {
    const days = buckets.get(weekStart)!
    const avg = (key: keyof DailyTotals) =>
      (days.reduce((sum, d) => sum + (d[key] as number), 0) / days.length) as number
    return {
      weekStart,
      weekEnd: addDays(weekStart, 6),
      days: days.length,
      avgCalories: avg('calories'),
      avgProtein: avg('protein'),
      avgCarbs: avg('carbs'),
      avgFat: avg('fat'),
      deltaCaloriesFromPrevWeek: null,
    }
  })

  for (let i = 1; i < results.length; i++) {
    results[i].deltaCaloriesFromPrevWeek = results[i].avgCalories - results[i - 1].avgCalories
  }

  return results.reverse()
}

export function useNutrition() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<FoodLogWithFood[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('food_logs')
      .select('*, food:foods(id, name, serving_size, unit_label, calories, protein, carbs, fat)')
      .order('logged_date', { ascending: true })
    if (error) setError(error.message)
    else setLogs((data ?? []) as FoodLogWithFood[])
    setLoading(false)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function logFood(foodId: string, amount: number, date: string): Promise<boolean> {
    if (!user) return false
    const { data, error } = await supabase
      .from('food_logs')
      .insert({ user_id: user.id, food_id: foodId, logged_date: date, amount })
      .select('*, food:foods(id, name, serving_size, unit_label, calories, protein, carbs, fat)')
      .single()
    if (error || !data) {
      setError(error?.message ?? 'Failed to log food')
      return false
    }
    setLogs((prev) => [...prev, data as FoodLogWithFood])
    return true
  }

  async function deleteLog(id: string) {
    const { error } = await supabase.from('food_logs').delete().eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    setLogs((prev) => prev.filter((l) => l.id !== id))
  }

  function logsForDate(date: string): FoodLogWithFood[] {
    return logs.filter((l) => l.logged_date === date)
  }

  function totalsForDate(date: string): DailyTotals {
    const dayLogs = logsForDate(date)
    return computeDailyTotals(dayLogs)[0] ?? { date, calories: 0, protein: 0, carbs: 0, fat: 0 }
  }

  const dailyTotals = computeDailyTotals(logs)
  const weeklyAverages = computeWeeklyAverages(dailyTotals)

  return { logs, loading, error, logFood, deleteLog, logsForDate, totalsForDate, dailyTotals, weeklyAverages, refresh }
}
