import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Exercise } from '../types/database'
import { useAuth } from '../contexts/AuthContext'

export function useExercises() {
  const { user } = useAuth()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase.from('exercises').select('*').order('name', { ascending: true })
    if (error) setError(error.message)
    else setExercises(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function addExercise(name: string): Promise<Exercise | null> {
    if (!user) return null
    const trimmed = name.trim()
    if (!trimmed) return null

    const existing = exercises.find((e) => e.name.toLowerCase() === trimmed.toLowerCase())
    if (existing) return existing

    const { data, error } = await supabase
      .from('exercises')
      .insert({ name: trimmed, user_id: user.id })
      .select()
      .single()
    if (error || !data) {
      setError(error?.message ?? 'Failed to create exercise')
      return null
    }
    setExercises((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return data
  }

  async function deleteExercise(id: string) {
    const { error } = await supabase.from('exercises').delete().eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    setExercises((prev) => prev.filter((e) => e.id !== id))
  }

  return { exercises, loading, error, addExercise, deleteExercise, refresh }
}
