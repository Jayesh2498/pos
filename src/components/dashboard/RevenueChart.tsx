import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import type { HourlySale, DailySale, DashboardRange } from '@/hooks/use-dashboard'
import { currencySymbol } from '@/lib/utils'

interface Props {
  hourly: HourlySale[]
  daily: DailySale[]
  range: DashboardRange
  currency: string
}

function CustomTooltip({ active, payload, label, sym }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--color-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 10,
      padding: '8px 12px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      fontSize: 12,
    }}>
      <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{label}</p>
      <p style={{ margin: 0, color: 'var(--color-primary)', fontWeight: 800, fontSize: 14 }}>
        {sym}{Number(payload[0].value).toFixed(2)}
      </p>
    </div>
  )
}

export default function RevenueChart({ hourly, daily, range, currency }: Props) {
  const sym = currencySymbol(currency)
  const data = range === 'today' ? hourly : daily
  const xKey = range === 'today' ? 'hour' : 'date'

  if (data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, flexDirection: 'column', gap: 8 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📊</div>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>No data for this period</p>
      </div>
    )
  }

  const maxVal = Math.max(...data.map((d: any) => d.revenue))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="35%">
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={1} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.5} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: 'var(--color-text-secondary)', fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `${sym}${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
          width={52}
        />
        <Tooltip content={<CustomTooltip sym={sym} />} cursor={{ fill: 'var(--color-border)', opacity: 0.5, radius: 4 }} />
        <Bar dataKey="revenue" fill="url(#revenueGrad)" radius={[6, 6, 0, 0]}>
          {data.map((entry: any, index: number) => (
            <Cell
              key={index}
              fill={entry.revenue === maxVal ? 'var(--color-primary)' : 'url(#revenueGrad)'}
              fillOpacity={entry.revenue === maxVal ? 1 : 0.75}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
