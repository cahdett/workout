import { useEffect, useState } from 'react'

interface RestTimerProps {
  seconds: number
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

export default function RestTimer({ seconds, onDismiss }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    if (remaining <= 0) {
      beep()
      return
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining])

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
        <button
          onClick={() => setRemaining((r) => Math.max(0, r + 15))}
          className="rounded-full bg-white/20 px-3 py-1 text-sm active:bg-white/30"
        >
          +15s
        </button>
        <button onClick={onDismiss} className="rounded-full bg-white/20 px-3 py-1 text-sm active:bg-white/30">
          Skip
        </button>
      </div>
    </div>
  )
}
