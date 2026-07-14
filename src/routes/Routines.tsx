import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRoutines } from '../hooks/useRoutines'

export default function Routines() {
  const { routines, loading, createRoutine, deleteRoutine } = useRoutines()
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || creating) return
    setCreating(true)
    const routine = await createRoutine(name)
    setCreating(false)
    setName('')
    if (routine) navigate(`/routines/${routine.id}`)
  }

  return (
    <div className="px-4 pb-24 pt-[calc(1rem+var(--safe-top))]">
      <h1 className="mb-4 text-2xl font-semibold">Routines</h1>

      <form onSubmit={handleCreate} className="mb-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New routine name (e.g. Push Day)"
          className="flex-1 rounded-lg bg-zinc-900 px-4 py-3 outline-none placeholder:text-zinc-500"
        />
        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-3 font-medium disabled:opacity-40"
        >
          Create
        </button>
      </form>

      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : routines.length === 0 ? (
        <p className="text-zinc-500">No routines yet. Create one above.</p>
      ) : (
        <ul className="divide-y divide-zinc-800 rounded-lg bg-zinc-900/50">
          {routines.map((routine) => (
            <li key={routine.id} className="flex items-center justify-between px-4 py-3">
              <Link to={`/routines/${routine.id}`} className="flex-1">
                {routine.name}
              </Link>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(`/workout/active?routineId=${routine.id}`)}
                  className="rounded-lg bg-indigo-600/20 px-3 py-1.5 text-sm text-indigo-300"
                >
                  Start
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${routine.name}"?`)) deleteRoutine(routine.id)
                  }}
                  className="text-sm text-red-400"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
