'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

type Props = {
  data: { macroetapa: string; count: number; cor: string }[]
}

export function GraficoFunil({ data }: Props) {
  if (data.every((d) => d.count === 0)) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-stone-400">
        Sem leads ativos no pipeline
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f5f0e8" horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#78716c' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="macroetapa"
          width={80}
          tick={{ fontSize: 11, fill: '#44403c' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e8e0d0' }}
          cursor={{ fill: '#fef9f0' }}
          formatter={(v) => [v, 'Leads']}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.cor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
