import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { parseLocalDate, type WeeklyAverage } from '../hooks/useBodyWeight'

interface WeightChartProps {
  data: WeeklyAverage[]
}

export default function WeightChart({ data }: WeightChartProps) {
  const formatted = [...data]
    .reverse()
    .map((w) => ({
      ...w,
      label: parseLocalDate(w.weekStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    }))

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="#2c2c2a" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#898781"
            tick={{ fill: '#898781', fontSize: 12 }}
            axisLine={{ stroke: '#383835' }}
            tickLine={false}
          />
          <YAxis
            stroke="#898781"
            tick={{ fill: '#898781', fontSize: 12 }}
            axisLine={{ stroke: '#383835' }}
            tickLine={false}
            width={40}
            domain={['dataMin - 2', 'dataMax + 2']}
          />
          <Tooltip
            contentStyle={{
              background: '#1a1a19',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#ffffff',
            }}
            labelStyle={{ color: '#c3c2b7' }}
            formatter={(value) => [`${Number(value).toFixed(1)} lb`, 'Weekly avg']}
          />
          <Line
            type="monotone"
            dataKey="average"
            stroke="#3987e5"
            strokeWidth={2}
            strokeLinecap="round"
            dot={{ r: 4, fill: '#3987e5', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
