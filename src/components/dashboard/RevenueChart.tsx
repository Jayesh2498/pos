import type { HourlySale, DailySale, DashboardRange } from '@/hooks/use-dashboard'
import { currencySymbol } from '@/lib/utils'

interface Props {
  hourly: HourlySale[]
  daily: DailySale[]
  range: DashboardRange
  currency: string
}

export default function RevenueChart({ hourly, daily, range, currency }: Props) {
  const sym = currencySymbol(currency)
  const data = range === 'today' ? hourly : daily
  const xKey = range === 'today' ? 'hour' : 'date'

  const hasData = data.some((d: any) => d.revenue > 0)

  if (!hasData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, flexDirection: 'column', gap: 8 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📊</div>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>No data for this period</p>
      </div>
    )
  }

  const maxVal = Math.max(...data.map((d: any) => d.revenue))
  // Round up to a nice Y-axis max
  const yMax = Math.ceil(maxVal / 100) * 100 || 100
  const yTicks = [yMax, yMax * 0.75, yMax * 0.5, yMax * 0.25, 0]
  const chartH = 180 // px, not counting x-axis labels

  function fmtY(v: number) {
    if (v >= 1000) return `${sym}${(v / 1000).toFixed(1)}k`
    return `${sym}${v}`
  }

  return (
    <div style={{ display: 'flex', gap: 0, height: chartH + 40, overflow: 'hidden' }}>

      {/* Y-axis labels */}
      <div style={{ width: 52, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: 32, paddingTop: 0 }}>
        {yTicks.map(v => (
          <span key={v} style={{ fontSize: 11, color: 'var(--color-text-secondary)', textAlign: 'right', lineHeight: 1 }}>
            {fmtY(v)}
          </span>
        ))}
      </div>

      {/* Chart area */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Bars + gridlines */}
        <div style={{ flex: 1, position: 'relative', paddingBottom: 0 }}>
          {/* Horizontal gridlines */}
          {[0.75, 0.5, 0.25].map(pct => (
            <div key={pct} style={{
              position: 'absolute', left: 0, right: 0,
              bottom: `${pct * 100}%`,
              borderTop: '1px dashed var(--color-border)',
              pointerEvents: 'none',
            }} />
          ))}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            borderTop: '1px solid var(--color-border)',
            pointerEvents: 'none',
          }} />

          {/* Bars */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', gap: 4, paddingLeft: 4, paddingRight: 4 }}>
            {data.map((d: any, i: number) => {
              const pct = yMax > 0 ? (d.revenue / yMax) * 100 : 0
              const isMax = d.revenue === maxVal && d.revenue > 0
              return (
                <div
                  key={i}
                  title={`${d[xKey]}: ${sym}${d.revenue.toFixed(2)}`}
                  style={{
                    flex: 1,
                    height: `${Math.max(pct, pct > 0 ? 2 : 0)}%`,
                    borderRadius: '4px 4px 0 0',
                    background: isMax
                      ? 'var(--gradient-primary)'
                      : 'linear-gradient(to bottom, color-mix(in srgb, var(--color-primary) 80%, transparent), color-mix(in srgb, var(--color-primary) 45%, transparent))',
                    opacity: d.revenue === 0 ? 0 : (isMax ? 1 : 0.72),
                    transition: 'height 0.4s cubic-bezier(0.4,0,0.2,1)',
                    minHeight: d.revenue > 0 ? 3 : 0,
                  }}
                />
              )
            })}
          </div>
        </div>

        {/* X-axis labels */}
        <div style={{ height: 32, display: 'flex', alignItems: 'flex-start', paddingTop: 6, gap: 4, paddingLeft: 4, paddingRight: 4 }}>
          {data.map((d: any, i: number) => {
            // Show label only at start, midpoint, and end to avoid crowding
            const showLabel = i === 0 || i === data.length - 1 || (data.length <= 8) || (i % Math.ceil(data.length / 6) === 0)
            return (
              <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'var(--color-text-secondary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'clip', whiteSpace: 'nowrap' }}>
                {showLabel ? d[xKey] : ''}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
