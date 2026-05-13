'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const ORIGEM_LABEL: Record<string, string> = {
  INDICACAO: 'Indicação',
  INSTAGRAM: 'Instagram',
  FACEBOOK:  'Facebook',
  GOOGLE:    'Google',
  SITE:      'Site',
  FEIRA:     'Feira',
  EVENTO:    'Evento',
  WHATSAPP:  'WhatsApp',
  OUTRO:     'Outro',
}

const COLORS = ['#d97706', '#b45309', '#92400e', '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7', '#78716c']

type Props = {
  data: { origem: string; count: number }[]
}

export function GraficoOrigem({ data }: Props) {
  const chartData = data.map((d) => ({
    label: ORIGEM_LABEL[d.origem] ?? d.origem,
    count: d.count,
    origem: d.origem,
  }))

  if (chartData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-stone-400">
        Sem dados no período
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f5f0e8" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#78716c' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#78716c' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e8e0d0' }}
          cursor={{ fill: '#fef9f0' }}
          formatter={(v) => [v, 'Leads']}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
