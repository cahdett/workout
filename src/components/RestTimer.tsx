import { useEffect, useRef, useState } from 'react'
import { useRestTimer } from '../contexts/RestTimerContext'

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
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
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

export default function RestTimer() {
  const { active, addTime, dismiss } = useRestTimer()
  const [remaining, setRemaining] = useState(0)
  const firedRef = useRef(false)

  useEffect(() => {
    firedRef.current = false
  }, [active?.key])

  useEffect(() => {
    if (!active) return
    function tick() {
      setRemaining(Math.max(0, Math.round((active!.endAt - Date.now()) / 1000)))
    }
    tick()
    const id = setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [active])

  useEffect(() => {
    if (!active || remaining > 0 || firedRef.current) return
    firedRef.current = true
    beep()
    notifyRestDone()
  }, [active, remaining])

  if (!active) return null

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
        <button onClick={dismiss} className="rounded-full bg-white/20 px-3 py-1 text-sm active:bg-white/30">
          Skip
        </button>
      </div>
    </div>
  )
}
