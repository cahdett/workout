import { createContext, useContext, useState, type ReactNode } from 'react'

interface ActiveRestTimer {
  key: number
  endAt: number
}

interface RestTimerValue {
  active: ActiveRestTimer | null
  start: (seconds: number) => void
  addTime: (deltaSeconds: number) => void
  dismiss: () => void
}

const RestTimerContext = createContext<RestTimerValue | null>(null)

export function RestTimerProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveRestTimer | null>(null)

  function start(seconds: number) {
    setActive({ key: Date.now(), endAt: Date.now() + seconds * 1000 })
  }

  function addTime(deltaSeconds: number) {
    setActive((prev) => (prev ? { ...prev, endAt: prev.endAt + deltaSeconds * 1000 } : prev))
  }

  function dismiss() {
    setActive(null)
  }

  return <RestTimerContext.Provider value={{ active, start, addTime, dismiss }}>{children}</RestTimerContext.Provider>
}

export function useRestTimer() {
  const ctx = useContext(RestTimerContext)
  if (!ctx) throw new Error('useRestTimer must be used within RestTimerProvider')
  return ctx
}
