import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFoods } from '../hooks/useFoods'

const emptyForm = {
  name: '',
  mode: 'weight' as 'weight' | 'count',
  servingSize: '',
  unitLabel: '',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
}

export default function NutritionFoods() {
  const { foods, loading, addFood, deleteFood } = useFoods()
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  function update<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const isCountMode = form.mode === 'count'

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const servingSize = isCountMode ? 1 : Number(form.servingSize)
    if (!form.name.trim() || !servingSize || (isCountMode && !form.unitLabel.trim()) || submitting) return
    setSubmitting(true)
    await addFood({
      name: form.name,
      servingSize,
      unitLabel: isCountMode ? form.unitLabel.trim() : null,
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
    })
    setForm(emptyForm)
    setSubmitting(false)
  }

  return (
    <div className="px-4 pb-24 pt-[calc(1rem+var(--safe-top))]">
      <div className="mb-4 flex items-center gap-3">
        <Link to="/nutrition" className="text-sm text-indigo-400">
          ← Back
        </Link>
        <h1 className="text-2xl font-semibold">Foods</h1>
      </div>

      <form onSubmit={handleAdd} className="mb-6 space-y-2 rounded-lg bg-zinc-900/50 p-4">
        <input
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="Food name"
          className="w-full rounded-lg bg-zinc-900 px-4 py-3 outline-none placeholder:text-zinc-500"
        />

        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => update('mode', 'weight')}
            className={`flex-1 rounded-lg py-2 font-medium ${form.mode === 'weight' ? 'bg-indigo-600' : 'bg-zinc-900 text-zinc-400'}`}
          >
            By weight (g)
          </button>
          <button
            type="button"
            onClick={() => update('mode', 'count')}
            className={`flex-1 rounded-lg py-2 font-medium ${form.mode === 'count' ? 'bg-indigo-600' : 'bg-zinc-900 text-zinc-400'}`}
          >
            By count (e.g. rice cakes)
          </button>
        </div>

        {isCountMode ? (
          <input
            value={form.unitLabel}
            onChange={(e) => update('unitLabel', e.target.value)}
            placeholder="Unit name (e.g. rice cake, pouch, scoop)"
            className="w-full rounded-lg bg-zinc-900 px-4 py-3 outline-none placeholder:text-zinc-500"
          />
        ) : (
          <input
            type="number"
            inputMode="decimal"
            value={form.servingSize}
            onChange={(e) => update('servingSize', e.target.value)}
            placeholder="Serving size (g)"
            className="w-full rounded-lg bg-zinc-900 px-4 py-3 outline-none placeholder:text-zinc-500"
          />
        )}

        <p className="text-xs text-zinc-500">
          Macros per {isCountMode ? '1 unit' : 'serving'} above:
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={form.calories}
            onChange={(e) => update('calories', e.target.value)}
            placeholder="Calories"
            className="flex-1 rounded-lg bg-zinc-900 px-3 py-3 text-sm outline-none placeholder:text-zinc-500"
          />
          <input
            type="number"
            inputMode="decimal"
            value={form.protein}
            onChange={(e) => update('protein', e.target.value)}
            placeholder="Protein (g)"
            className="flex-1 rounded-lg bg-zinc-900 px-3 py-3 text-sm outline-none placeholder:text-zinc-500"
          />
          <input
            type="number"
            inputMode="decimal"
            value={form.carbs}
            onChange={(e) => update('carbs', e.target.value)}
            placeholder="Carbs (g)"
            className="flex-1 rounded-lg bg-zinc-900 px-3 py-3 text-sm outline-none placeholder:text-zinc-500"
          />
          <input
            type="number"
            inputMode="decimal"
            value={form.fat}
            onChange={(e) => update('fat', e.target.value)}
            placeholder="Fat (g)"
            className="flex-1 rounded-lg bg-zinc-900 px-3 py-3 text-sm outline-none placeholder:text-zinc-500"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !form.name.trim() || (isCountMode ? !form.unitLabel.trim() : !form.servingSize)}
          className="w-full rounded-lg bg-indigo-600 py-3 font-medium disabled:opacity-40"
        >
          Add Food
        </button>
      </form>

      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : foods.length === 0 ? (
        <p className="text-zinc-500">No foods yet. Add your first one above.</p>
      ) : (
        <ul className="divide-y divide-zinc-800 rounded-lg bg-zinc-900/50">
          {foods.map((food) => (
            <li key={food.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p>{food.name}</p>
                <p className="text-sm text-zinc-500">
                  Per {food.unit_label ? `1 ${food.unit_label}` : `${food.serving_size}g`}: {food.calories} cal ·{' '}
                  {food.protein}g P · {food.carbs}g C · {food.fat}g F
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm(`Delete "${food.name}"? This cannot be undone.`)) deleteFood(food.id)
                }}
                className="text-sm text-red-400"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
