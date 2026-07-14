import PRBadge from './PRBadge'

interface SetRowProps {
  setNumber: number
  weight: number
  reps: number
  isPR?: boolean
}

export default function SetRow({ setNumber, weight, reps, isPR }: SetRowProps) {
  return (
    <div className="flex items-center justify-between rounded bg-zinc-800/60 px-3 py-2 text-sm">
      <span className="text-zinc-400">Set {setNumber}</span>
      <span className="font-medium">
        {weight} × {reps}
      </span>
      {isPR ? <PRBadge /> : <span />}
    </div>
  )
}
