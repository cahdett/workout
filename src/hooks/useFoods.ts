import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Food } from '../types/database'
import { useAuth } from '../contexts/AuthContext'

export interface FoodInput {
  name: string
  servingSize: number
  unitLabel: string | null
  calories: number
  protein: number
  carbs: number
  fat: number
}

export function useFoods() {
  const { user } = useAuth()
  const [foods, setFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase.from('foods').select('*').order('name', { ascending: true })
    if (error) setError(error.message)
    else setFoods(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function addFood(input: FoodInput): Promise<Food | null> {
    if (!user) return null
    const { data, error } = await supabase
      .from('foods')
      .insert({
        user_id: user.id,
        name: input.name.trim(),
        serving_size: input.servingSize,
        unit_label: input.unitLabel,
        calories: input.calories,
        protein: input.protein,
        carbs: input.carbs,
        fat: input.fat,
      })
      .select()
      .single()
    if (error || !data) {
      setError(error?.message ?? 'Failed to create food')
      return null
    }
    setFoods((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return data
  }

  async function deleteFood(id: string) {
    const { error } = await supabase.from('foods').delete().eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    setFoods((prev) => prev.filter((f) => f.id !== id))
  }

  return { foods, loading, error, addFood, deleteFood, refresh }
}
