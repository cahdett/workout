import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export function useGoalWeight() {
  const { user } = useAuth()
  const [goalWeight, setGoalWeight] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase.from('user_settings').select('goal_weight').eq('user_id', user.id).maybeSingle()
    setGoalWeight(data?.goal_weight ?? null)
    setLoading(false)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function saveGoalWeight(value: number | null) {
    if (!user) return
    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, goal_weight: value, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (!error) setGoalWeight(value)
  }

  return { goalWeight, loading, saveGoalWeight }
}
