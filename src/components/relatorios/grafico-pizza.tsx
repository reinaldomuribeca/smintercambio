'use client'

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const COLORS = [
  '#d97706', '#f59e0b', '#b45309', '#92400e', '#78350f',
  '#a78bfa', '#38bdf8', '#34d399', '#f97316', '#78716c',
]

type Props = {
  data: { label: string; count: number }[]
  height?: number
}

export function GraficoPizza({ data, height = 280 }: Props) {
  const filled = data.filter((d) => d.count > 0)

  if (filled.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-stone-400" style={{ height }}>
        Sem dados no período
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={filled}
          dataKey="count"
          nameKey="label"
          cx="50%"
          cy="42%"
          outerRadius={85}
          innerRadius={42}
        >
          {filled.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e8e0d0' }}
          formatter={(v) => [v, 'Leads']}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontSize: 11, color: '#57534e' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
