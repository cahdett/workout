import { useEffect, useRef, useState } from 'react'

interface RestTimerProps {
  seconds: number
  notify?: boolean
  onDismiss: () => void
}

function beep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    osc.frequency.value = 880
    osc.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.25)
  } catch {
    // Web Audio unavailable — silently skip the beep.
  }
}

async function notifyRestDone() {
  try {
    const registration = await navigator.serviceWorker.ready
    await registration.showNotification('Rest complete 💪', {
      body: 'Time for your next set.',
      tag: 'rest-timer',
    })
  } catch {
    // Notifications unavailable (e.g. not installed as a home-screen app) — the in-app beep still covers it.
  }
}

export default function RestTimer({ seconds, notify, onDismiss }: RestTimerProps) {
  // An absolute end time (not a pure countdown) so backgrounding/throttling
  // on iOS can't desync the displayed remaining time.
  const endAtRef = useRef(Date.now() + seconds * 1000)
  const [remaining, setRemaining] = useState(seconds)
  const firedRef = useRef(false)

  useEffect(() => {
    function tick() {
      setRemaining(Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000)))
    }
    tick()
    const id = setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])

  useEffect(() => {
    if (remaining > 0 || firedRef.current) return
    firedRef.current = true
    beep()
    if (notify) notifyRestDone()
  }, [remaining, notify])

  function addTime(delta: number) {
    endAtRef.current += delta * 1000
    setRemaining((r) => Math.max(0, r + delta))
  }

  const minutes = Math.floor(remaining / 60)
  const secs = remaining % 60

  return (
    <div
      className="fixed inset-x-4 z-40 flex items-center justify-between rounded-xl bg-indigo-600 px-4 py-3 shadow-lg"
      style={{ bottom: 'calc(5rem + var(--safe-bottom))' }}
    >
      <span className="font-mono text-lg tabular-nums">
        {minutes}:{String(secs).padStart(2, '0')}
      </span>
      <div className="flex gap-2">
        <button onClick={() => addTime(15)} className="rounded-full bg-white/20 px-3 py-1 text-sm active:bg-white/30">
          +15s
        </button>
        <button onClick={onDismiss} className="rounded-full bg-white/20 px-3 py-1 text-sm active:bg-white/30">
          Skip
        </button>
      </div>
    </div>
  )
}
