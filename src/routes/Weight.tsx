import { useEffect, useState } from 'react'
import { parseLocalDate, todayLocalDateString } from '../lib/date'
import { useBodyWeight } from '../hooks/useBodyWeight'
import { useGoalWeight } from '../hooks/useGoalWeight'
import WeightChart from '../components/WeightChart'

function formatWeekRange(weekStart: string, weekEnd: string): string {
  const start = parseLocalDate(weekStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const end = parseLocalDate(weekEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${start} – ${end}`
}

export default function Weight() {
  const { logs, loading, logWeight, deleteLog, weeklyAverages } = useBodyWeight()
  const { goalWeight, saveGoalWeight } = useGoalWeight()
  const [date, setDate] = useState(todayLocalDateString())
  const [weight, setWeight] = useState('')
  const [saving, setSaving] = useState(false)
  const [goalInput, setGoalInput] = useState('')
  const [editingGoal, setEditingGoal] = useState(false)

  const existingForDate = logs.find((l) => l.logged_date === date)

  useEffect(() => {
    setWeight(existingForDate ? String(existingForDate.weight) : '')
  }, [date, existingForDate])

  useEffect(() => {
    setGoalInput(goalWeight != null ? String(goalWeight) : '')
  }, [goalWeight])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const parsed = Number(weight)
    if (!weight.trim() || Number.isNaN(parsed) || parsed <= 0 || saving) return
    setSaving(true)
    await logWeight(parsed, date)
    setSaving(false)
  }

  async function handleSaveGoal(e: React.FormEvent) {
    e.preventDefault()
    const parsed = Number(goalInput)
    if (!goalInput.trim() || Number.isNaN(parsed) || parsed <= 0) return
    await saveGoalWeight(parsed)
    setEditingGoal(false)
  }

  const latestWeight = logs.length > 0 ? Number(logs[logs.length - 1].weight) : null
  const toGoal = latestWeight != null && goalWeight != null ? latestWeight - goalWeight : null

  const recentLogs = [...logs].reverse().slice(0, 14)

  return (
    <div className="px-4 pb-24 pt-[calc(1rem+var(--safe-top))]">
      <h1 className="mb-4 text-2xl font-semibold">Weight</h1>

      <div className="mb-6 rounded-lg bg-zinc-900/50 p-4">
        {editingGoal || goalWeight == null ? (
          <form onSubmit={handleSaveGoal} className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="Goal weight (lb)"
              className="flex-1 rounded-lg bg-zinc-900 px-4 py-3 outline-none placeholder:text-zinc-500"
            />
            <button
              type="submit"
              disabled={!goalInput.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-3 font-medium disabled:opacity-40"
            >
              Set
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Goal weight</p>
              <p className="font-medium">
                {goalWeight} lb
                {toGoal !== null && (
                  <span className="ml-2 text-sm text-zinc-500">
                    ({Math.abs(toGoal).toFixed(1)} lb {toGoal > 0 ? 'to lose' : toGoal < 0 ? 'to gain' : 'away'})
                  </span>
                )}
              </p>
            </div>
            <button onClick={() => setEditingGoal(true)} className="text-sm text-indigo-400">
              Edit
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="mb-6 space-y-2 rounded-lg bg-zinc-900/50 p-4">
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            max={todayLocalDateString()}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg bg-zinc-900 px-3 py-3 outline-none [color-scheme:dark]"
          />
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Weight (lb)"
            className="flex-1 rounded-lg bg-zinc-900 px-4 py-3 outline-none placeholder:text-zinc-500"
          />
        </div>
        <button
          type="submit"
          disabled={saving || !weight.trim()}
          className="w-full rounded-lg bg-indigo-600 py-3 font-medium disabled:opacity-40"
        >
          {existingForDate ? 'Update' : 'Log'} Weight
        </button>
      </form>

      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : weeklyAverages.length === 0 ? (
        <p className="text-zinc-500">Log your weight daily to start seeing weekly averages here.</p>
      ) : (
        <>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-zinc-500">Weekly Trend</h2>
          <div className="mb-6 rounded-lg bg-zinc-900/50 p-3">
            <WeightChart data={weeklyAverages} goalWeight={goalWeight} />
          </div>

          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-zinc-500">Weekly Averages</h2>
          <ul className="mb-6 divide-y divide-zinc-800 rounded-lg bg-zinc-900/50">
            {weeklyAverages.map((w) => (
              <li key={w.weekStart} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{formatWeekRange(w.weekStart, w.weekEnd)}</p>
                  <p className="text-sm text-zinc-500">
                    {w.count} entr{w.count === 1 ? 'y' : 'ies'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{w.average.toFixed(1)} lb</p>
                  {w.deltaFromPrevWeek !== null && (
                    <p className={`text-sm ${w.deltaFromPrevWeek < 0 ? 'text-green-400' : w.deltaFromPrevWeek > 0 ? 'text-amber-300' : 'text-zinc-500'}`}>
                      {w.deltaFromPrevWeek > 0 ? '+' : ''}
                      {w.deltaFromPrevWeek.toFixed(1)} lb vs last week
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-zinc-500">Recent Entries</h2>
          <ul className="divide-y divide-zinc-800 rounded-lg bg-zinc-900/50">
            {recentLogs.map((log) => (
              <li key={log.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-zinc-300">
                  {parseLocalDate(log.logged_date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{Number(log.weight).toFixed(1)} lb</span>
                  <button
                    onClick={() => {
                      if (confirm(`Delete the entry for ${log.logged_date}?`)) deleteLog(log.id)
                    }}
                    className="text-sm text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
