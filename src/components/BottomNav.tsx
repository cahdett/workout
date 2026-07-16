import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/routines', label: 'Routines', icon: '📋' },
  { to: '/history', label: 'History', icon: '🕓' },
  { to: '/progress', label: 'Progress', icon: '📈' },
  { to: '/weight', label: 'Weight', icon: '⚖️' },
  { to: '/nutrition', label: 'Food', icon: '🍎' },
  { to: '/exercises', label: 'Exercises', icon: '🏋️' },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-zinc-800 bg-zinc-950/95 backdrop-blur"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`
          }
        >
          <span className="text-lg">{tab.icon}</span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
