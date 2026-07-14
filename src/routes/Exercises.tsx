import { useState } from 'react'
import { useExercises } from '../hooks/useExercises'

export default function Exercises() {
  const { exercises, loading, addExercise, deleteExercise } = useExercises()
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || submitting) return
    setSubmitting(true)
    await addExercise(name)
    setName('')
    setSubmitting(false)
  }

  return (
    <div className="px-4 pb-24 pt-[calc(1rem+var(--safe-top))]">
      <h1 className="mb-4 text-2xl font-semibold">Exercises</h1>

      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New exercise name"
          className="flex-1 rounded-lg bg-zinc-900 px-4 py-3 outline-none placeholder:text-zinc-500"
        />
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-3 font-medium disabled:opacity-40"
        >
          Add
        </button>
      </form>

      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : exercises.length === 0 ? (
        <p className="text-zinc-500">No exercises yet. Add your first one above.</p>
      ) : (
        <ul className="divide-y divide-zinc-800 rounded-lg bg-zinc-900/50">
          {exercises.map((exercise) => (
            <li key={exercise.id} className="flex items-center justify-between px-4 py-3">
              <span>{exercise.name}</span>
              <button
                onClick={() => {
                  if (confirm(`Delete "${exercise.name}"? This cannot be undone.`)) deleteExercise(exercise.id)
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
