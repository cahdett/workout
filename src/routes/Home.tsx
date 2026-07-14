import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useRoutines } from '../hooks/useRoutines'

export default function Home() {
  const { user, signOut } = useAuth()
  const { routines, loading } = useRoutines()
  const navigate = useNavigate()

  return (
    <div className="px-4 pb-24 pt-[calc(1rem+var(--safe-top))]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Ready to lift?</h1>
          <p className="text-sm text-zinc-500">{user?.email}</p>
        </div>
        <button onClick={signOut} className="text-sm text-zinc-400">
          Sign out
        </button>
      </div>

      <button
        onClick={() => navigate('/workout/active')}
        className="mb-6 w-full rounded-lg bg-indigo-600 py-4 text-lg font-medium"
      >
        Start Empty Workout
      </button>

      <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-zinc-500">Your Routines</h2>
      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : routines.length === 0 ? (
        <p className="text-zinc-500">
          No routines yet.{' '}
          <button onClick={() => navigate('/routines')} className="text-indigo-400 underline">
            Create one
          </button>
        </p>
      ) : (
        <ul className="divide-y divide-zinc-800 rounded-lg bg-zinc-900/50">
          {routines.map((routine) => (
            <li key={routine.id} className="flex items-center justify-between px-4 py-3">
              <span>{routine.name}</span>
              <button
                onClick={() => navigate(`/workout/active?routineId=${routine.id}`)}
                className="rounded-lg bg-indigo-600/20 px-3 py-1.5 text-sm text-indigo-300"
              >
                Start
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
