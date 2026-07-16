import { useState } from 'react'
import { Link } from 'react-router-dom'
import { parseLocalDate, todayLocalDateString } from '../lib/date'
import { useFoods } from '../hooks/useFoods'
import { useNutrition } from '../hooks/useNutrition'

function formatWeekRange(weekStart: string, weekEnd: string): string {
  const start = parseLocalDate(weekStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const end = parseLocalDate(weekEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${start} – ${end}`
}

function formatAmount(amount: number, unitLabel: string | null): string {
  if (!unitLabel) return `${amount}g`
  const label = amount === 1 || unitLabel.endsWith('s') ? unitLabel : `${unitLabel}s`
  return `${amount} ${label}`
}

export default function Nutrition() {
  const { foods, loading: foodsLoading } = useFoods()
  const { loading, logFood, deleteLog, logsForDate, totalsForDate, weeklyAverages } = useNutrition()
  const [date, setDate] = useState(todayLocalDateString())
  const [foodId, setFoodId] = useState('')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const dayLogs = logsForDate(date)
  const totals = totalsForDate(date)
  const selectedFood = foods.find((f) => f.id === foodId) ?? null

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const parsedAmount = Number(amount)
    if (!foodId || !amount.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0 || saving) return
    setSaving(true)
    await logFood(foodId, parsedAmount, date)
    setAmount('')
    setSaving(false)
  }

  return (
    <div className="px-4 pb-24 pt-[calc(1rem+var(--safe-top))]">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Nutrition</h1>
        <Link to="/nutrition/foods" className="text-sm text-indigo-400">
          Manage Foods
        </Link>
      </div>

      <div className="mb-4 rounded-lg bg-zinc-900/50 p-4">
        <input
          type="date"
          value={date}
          max={todayLocalDateString()}
          onChange={(e) => setDate(e.target.value)}
          className="mb-3 w-full rounded-lg bg-zinc-900 px-3 py-3 outline-none [color-scheme:dark]"
        />

        {foodsLoading ? null : foods.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No foods yet.{' '}
            <Link to="/nutrition/foods" className="text-indigo-400 underline">
              Add one
            </Link>{' '}
            to start logging.
          </p>
        ) : (
          <form onSubmit={handleAdd} className="flex gap-2">
            <select
              value={foodId}
              onChange={(e) => setFoodId(e.target.value)}
              className="flex-1 rounded-lg bg-zinc-900 px-3 py-3 text-sm outline-none"
            >
              <option value="">Select food…</option>
              {foods.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              inputMode="decimal"
              step={selectedFood?.unit_label ? '0.5' : '1'}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={selectedFood?.unit_label ? formatAmount(2, selectedFood.unit_label) : 'Grams'}
              className="w-28 rounded-lg bg-zinc-900 px-3 py-3 outline-none placeholder:text-zinc-500"
            />
            <button
              type="submit"
              disabled={saving || !foodId || !amount.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-3 font-medium disabled:opacity-40"
            >
              Add
            </button>
          </form>
        )}
      </div>

      <div className="mb-6 grid grid-cols-4 gap-2 rounded-lg bg-zinc-900/50 p-4 text-center">
        <div>
          <p className="text-lg font-semibold">{Math.round(totals.calories)}</p>
          <p className="text-xs text-zinc-500">cal</p>
        </div>
        <div>
          <p className="text-lg font-semibold">{Math.round(totals.protein)}g</p>
          <p className="text-xs text-zinc-500">protein</p>
        </div>
        <div>
          <p className="text-lg font-semibold">{Math.round(totals.carbs)}g</p>
          <p className="text-xs text-zinc-500">carbs</p>
        </div>
        <div>
          <p className="text-lg font-semibold">{Math.round(totals.fat)}g</p>
          <p className="text-xs text-zinc-500">fat</p>
        </div>
      </div>

      {dayLogs.length > 0 && (
        <ul className="mb-6 divide-y divide-zinc-800 rounded-lg bg-zinc-900/50">
          {dayLogs.map((log) => (
            <li key={log.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p>{log.food.name}</p>
                <p className="text-sm text-zinc-500">
                  {formatAmount(log.amount, log.food.unit_label)} ·{' '}
                  {Math.round((log.food.calories * log.amount) / log.food.serving_size)} cal
                </p>
              </div>
              <button onClick={() => deleteLog(log.id)} className="text-sm text-red-400">
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : weeklyAverages.length === 0 ? (
        <p className="text-zinc-500">Log meals daily to start seeing weekly averages here.</p>
      ) : (
        <>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-zinc-500">Weekly Averages (per day)</h2>
          <ul className="divide-y divide-zinc-800 rounded-lg bg-zinc-900/50">
            {weeklyAverages.map((w) => (
              <li key={w.weekStart} className="px-4 py-3">
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-medium">{formatWeekRange(w.weekStart, w.weekEnd)}</p>
                  <p className="text-sm text-zinc-500">
                    {w.days} day{w.days === 1 ? '' : 's'} logged
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-zinc-400">
                    {Math.round(w.avgProtein)}g protein · {Math.round(w.avgCarbs)}g carbs · {Math.round(w.avgFat)}g fat
                  </p>
                  <div className="text-right">
                    <p className="font-medium">{Math.round(w.avgCalories)} cal</p>
                    {w.deltaCaloriesFromPrevWeek !== null && (
                      <p className="text-xs text-zinc-500">
                        {w.deltaCaloriesFromPrevWeek > 0 ? '+' : ''}
                        {Math.round(w.deltaCaloriesFromPrevWeek)} vs last week
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
