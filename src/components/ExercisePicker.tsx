import { useMemo, useState } from 'react'
import type { Exercise } from '../types/database'

interface ExercisePickerProps {
  exercises: Exercise[]
  onSelect: (exercise: Exercise) => void
  onCreate: (name: string) => Promise<Exercise | null>
  onClose: () => void
}

export default function ExercisePicker({ exercises, onSelect, onCreate, onClose }: ExercisePickerProps) {
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return exercises
    return exercises.filter((e) => e.name.toLowerCase().includes(q))
  }, [exercises, query])

  const exactMatch = exercises.some((e) => e.name.toLowerCase() === query.trim().toLowerCase())

  async function handleCreate() {
    if (!query.trim() || creating) return
    setCreating(true)
    const created = await onCreate(query.trim())
    setCreating(false)
    if (created) onSelect(created)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/95 backdrop-blur-sm">
      <div className="flex items-center gap-3 border-b border-zinc-800 p-4 pt-[calc(1rem+var(--safe-top))]">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search or add an exercise"
          className="flex-1 rounded-lg bg-zinc-900 px-4 py-3 outline-none placeholder:text-zinc-500"
        />
        <button onClick={onClose} className="px-2 text-zinc-400">
          Cancel
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {query.trim() && !exactMatch && (
          <button
            onClick={handleCreate}
            disabled={creating}
            className="mb-1 w-full rounded-lg bg-indigo-600/20 px-4 py-3 text-left text-indigo-300 active:bg-indigo-600/30"
          >
            + Create "{query.trim()}"
          </button>
        )}
        {filtered.map((exercise) => (
          <button
            key={exercise.id}
            onClick={() => onSelect(exercise)}
            className="w-full rounded-lg px-4 py-3 text-left active:bg-zinc-800"
          >
            {exercise.name}
          </button>
        ))}
        {filtered.length === 0 && !query.trim() && (
          <p className="p-4 text-center text-zinc-500">No exercises yet — start typing to add one.</p>
        )}
      </div>
    </div>
  )
}
