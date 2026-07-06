import { getEstoqueStatus, ESTOQUE_LABELS } from '@/types'
import { cn } from '@/lib/utils'

interface StockBadgeProps {
  estoque: number
  showCount?: boolean
  size?: 'sm' | 'md'
}

const DOT: Record<string, string> = {
  disponivel: 'bg-green-500',
  baixo:      'bg-yellow-500',
  urgente:    'bg-orange-500 animate-pulse',
  esgotado:   'bg-red-500',
}

const BADGE: Record<string, string> = {
  disponivel: 'text-green-700 bg-green-100  border-green-200  dark:text-green-400  dark:bg-green-400/10  dark:border-green-400/20',
  baixo:      'text-yellow-700 bg-yellow-100 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-400/10 dark:border-yellow-400/20',
  urgente:    'text-orange-700 bg-orange-100 border-orange-200 dark:text-orange-400 dark:bg-orange-400/10 dark:border-orange-400/20',
  esgotado:   'text-red-700   bg-red-100    border-red-200    dark:text-red-400    dark:bg-red-400/10    dark:border-red-400/20',
}

export function StockBadge({ estoque, showCount = false, size = 'md' }: StockBadgeProps) {
  const status = getEstoqueStatus(estoque)
  const label  = ESTOQUE_LABELS[status]

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border font-body font-semibold',
      size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-3 py-1',
      BADGE[status]
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', DOT[status])} />
      {label}
      {showCount && estoque > 0 && (
        <span className="ml-0.5 opacity-70">({estoque})</span>
      )}
    </span>
  )
}
