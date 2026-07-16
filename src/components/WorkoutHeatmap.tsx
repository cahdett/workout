import { addDays, startOfWeek, todayLocalDateString } from '../lib/date'

interface WorkoutHeatmapProps {
  workoutDates: string[]
  weeks?: number
}

const LEVEL_COLORS = ['bg-zinc-800', 'bg-indigo-900', 'bg-indigo-700', 'bg-indigo-500', 'bg-indigo-400']

function level(count: number): string {
  if (count <= 0) return LEVEL_COLORS[0]
  if (count === 1) return LEVEL_COLORS[2]
  return LEVEL_COLORS[4]
}

export default function WorkoutHeatmap({ workoutDates, weeks = 20 }: WorkoutHeatmapProps) {
  const countsByDate = new Map<string, number>()
  for (const date of workoutDates) {
    countsByDate.set(date, (countsByDate.get(date) ?? 0) + 1)
  }

  const today = todayLocalDateString()
  const firstWeekStart = addDays(startOfWeek(today), -7 * (weeks - 1))

  const columns: { date: string; count: number }[][] = []
  for (let w = 0; w < weeks; w++) {
    const weekStart = addDays(firstWeekStart, 7 * w)
    const column: { date: string; count: number }[] = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(weekStart, d)
      column.push({ date, count: date > today ? -1 : (countsByDate.get(date) ?? 0) })
    }
    columns.push(column)
  }

  const monthLabels = columns.map((column, i) => {
    const first = column[0].date
    const prevFirst = i > 0 ? columns[i - 1][0].date : null
    const month = first.slice(5, 7)
    const showLabel = i === 0 || (prevFirst && prevFirst.slice(5, 7) !== month)
    return showLabel
      ? new Date(Number(first.slice(0, 4)), Number(month) - 1, 1).toLocaleDateString(undefined, { month: 'short' })
      : ''
  })

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-[3px]">
        {columns.map((column, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            <span className="h-3 text-[10px] leading-3 text-zinc-500">{monthLabels[i]}</span>
            {column.map(({ date, count }) =>
              count < 0 ? (
                <div key={date} className="h-3 w-3 rounded-sm" />
              ) : (
                <div
                  key={date}
                  title={`${date}: ${count} workout${count === 1 ? '' : 's'}`}
                  className={`h-3 w-3 rounded-sm ${level(count)}`}
                />
              )
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
