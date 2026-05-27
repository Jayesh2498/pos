import type { TopProduct } from '@/hooks/use-dashboard'
import { currencySymbol } from '@/lib/utils'

interface Props {
  products: TopProduct[]
  currency: string
}

const RANK_COLORS = ['#F59E0B', '#9CA3AF', '#CD7C2F']

export default function TopProducts({ products, currency }: Props) {
  const sym = currencySymbol(currency)

  if (products.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: 8 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏆</div>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>No sales yet</p>
      </div>
    )
  }

  const max = products[0]?.total_revenue ?? 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {products.map((p, i) => (
        <div key={p.product_name_snapshot} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Rank badge */}
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: i < 3 ? `${RANK_COLORS[i]}22` : 'var(--color-bg)',
            color: i < 3 ? RANK_COLORS[i] : 'var(--color-text-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800,
          }}>
            {i + 1}
          </div>

          {/* Bar + info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                {p.product_name_snapshot}
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-primary)', flexShrink: 0 }}>
                {sym}{p.total_revenue.toFixed(2)}
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'var(--color-border)', overflow: 'hidden', marginBottom: 4 }}>
              <div
                style={{
                  height: '100%',
                  width: `${(p.total_revenue / max) * 100}%`,
                  background: i === 0
                    ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                    : 'var(--gradient-primary)',
                  borderRadius: 3,
                  transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            </div>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>
              {p.total_qty} unit{p.total_qty !== 1 ? 's' : ''} sold
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
