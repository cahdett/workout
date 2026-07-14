import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Routine } from '../types/database'
import { useAuth } from '../contexts/AuthContext'

export function useRoutines() {
  const { user } = useAuth()
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase.from('routines').select('*').order('created_at', { ascending: false })
    setRoutines(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function createRoutine(name: string): Promise<Routine | null> {
    if (!user || !name.trim()) return null
    const { data, error } = await supabase
      .from('routines')
      .insert({ name: name.trim(), user_id: user.id })
      .select()
      .single()
    if (error || !data) return null
    setRoutines((prev) => [data, ...prev])
    return data
  }

  async function deleteRoutine(id: string) {
    await supabase.from('routines').delete().eq('id', id)
    setRoutines((prev) => prev.filter((r) => r.id !== id))
  }

  async function renameRoutine(id: string, name: string) {
    if (!name.trim()) return
    await supabase.from('routines').update({ name: name.trim() }).eq('id', id)
    setRoutines((prev) => prev.map((r) => (r.id === id ? { ...r, name: name.trim() } : r)))
  }

  return { routines, loading, createRoutine, deleteRoutine, renameRoutine, refresh }
}
