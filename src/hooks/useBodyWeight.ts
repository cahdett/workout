import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { addDays, startOfWeek, todayLocalDateString } from '../lib/date'
import { useAuth } from '../contexts/AuthContext'
import type { BodyWeightLog } from '../types/database'

export interface WeeklyAverage {
  weekStart: string
  weekEnd: string
  average: number
  count: number
  deltaFromPrevWeek: number | null
}

function computeWeeklyAverages(logs: BodyWeightLog[]): WeeklyAverage[] {
  const buckets = new Map<string, number[]>()
  for (const log of logs) {
    const weekStart = startOfWeek(log.logged_date)
    const bucket = buckets.get(weekStart) ?? []
    bucket.push(Number(log.weight))
    buckets.set(weekStart, bucket)
  }

  const weeks = [...buckets.keys()].sort()
  const results: WeeklyAverage[] = weeks.map((weekStart) => {
    const values = buckets.get(weekStart)!
    const average = values.reduce((a, b) => a + b, 0) / values.length
    return { weekStart, weekEnd: addDays(weekStart, 6), average, count: values.length, deltaFromPrevWeek: null }
  })

  for (let i = 1; i < results.length; i++) {
    results[i].deltaFromPrevWeek = results[i].average - results[i - 1].average
  }

  return results.reverse()
}

export function useBodyWeight() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<BodyWeightLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('body_weight_logs')
      .select('*')
      .order('logged_date', { ascending: true })
    if (error) setError(error.message)
    else setLogs(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function logWeight(weight: number, date: string = todayLocalDateString()): Promise<boolean> {
    if (!user) return false
    const { data, error } = await supabase
      .from('body_weight_logs')
      .upsert({ user_id: user.id, logged_date: date, weight }, { onConflict: 'user_id,logged_date' })
      .select()
      .single()
    if (error || !data) {
      setError(error?.message ?? 'Failed to save weight')
      return false
    }
    setLogs((prev) => [...prev.filter((l) => l.logged_date !== date), data].sort((a, b) => a.logged_date.localeCompare(b.logged_date)))
    return true
  }

  async function deleteLog(id: string) {
    const { error } = await supabase.from('body_weight_logs').delete().eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    setLogs((prev) => prev.filter((l) => l.id !== id))
  }

  return {
    logs,
    loading,
    error,
    logWeight,
    deleteLog,
    refresh,
    weeklyAverages: computeWeeklyAverages(logs),
  }
}
