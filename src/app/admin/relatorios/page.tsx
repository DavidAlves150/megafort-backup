'use client'

import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Calendar, Download, Eye, Loader2, MousePointerClick, ReceiptText, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import RegisterSaleModal from '@/components/admin/RegisterSaleModal'
import toast from 'react-hot-toast'

type Venda = {
  id: string
  quantidade: number
  valor_venda: number | string
  valor_custo: number | string
  lucro_real: number | string
  canal_venda: string
  data_venda: string
  produto?: { nome?: string } | null
}

function numberValue(value: number | string | null | undefined) {
  return Number(value) || 0
}

export default function RelatoriosPage() {
  const [data, setData] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [sales, setSales] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: topView }, { data: clicks }, { data: prods }, { data: salesData, error: salesError }] = await Promise.all([
      supabase.from('produtos').select('id,nome,visualizacoes,preco_venda,preco_compra,imagens:product_images(url,is_principal)').eq('ativo', true).order('visualizacoes', { ascending: false }).limit(10),
      supabase.from('click_tracking').select('produto_id,tipo,criado_em,produto:produtos(nome)').order('criado_em', { ascending: false }).limit(500),
      supabase.from('produtos').select('id,nome,preco_compra,preco_venda,estoque,em_promocao,ativo').eq('ativo', true).order('nome').limit(500),
      supabase.from('vendas').select('id,quantidade,valor_venda,valor_custo,lucro_real,canal_venda,data_venda,produto:produtos(nome)').order('data_venda', { ascending: false }).limit(20),
    ])

    if (salesError) toast.error(`Não foi possível carregar os registros de vendas: ${salesError.message}`)

    const clickMap: Record<string, { nome: string; count: number }> = {}
    clicks?.forEach((click: any) => {
      if (!click.produto_id) return
      clickMap[click.produto_id] = clickMap[click.produto_id] || { nome: click.produto?.nome || '?', count: 0 }
      clickMap[click.produto_id].count++
    })

    const topClicks = Object.entries(clickMap)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([id, value]) => ({ id, nome: value.nome, cliques: value.count }))

    const today = new Date()
    const dailyClicks = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today)
      date.setDate(date.getDate() - index)
      const key = date.toISOString().slice(0, 10)
      return { dia: key, count: clicks?.filter((click: any) => click.criado_em.slice(0, 10) === key).length || 0 }
    }).reverse()

    const totalStockValue = prods?.reduce((total: number, product: any) => total + numberValue(product.preco_compra) * numberValue(product.estoque), 0) || 0
    setProducts((prods || []) as any[])
    setSales((salesData || []) as Venda[])
    setData({ topView: topView || [], topClicks, dailyClicks, totalStockValue, totalClicks: clicks?.length || 0 })
    setLoading(false)
  }

  const salesSummary = useMemo(() => {
    const registered = sales.length
    const revenue = sales.reduce((total, sale) => total + numberValue(sale.valor_venda) * sale.quantidade, 0)
    const grossProfit = sales.reduce((total, sale) => total + numberValue(sale.lucro_real), 0)
    return { registered, revenue, grossProfit }
  }, [sales])

  async function exportExcel() {
    setExporting(true)
    try {
      const response = await fetch('/api/export-excel')
      if (!response.ok) throw new Error('Erro na exportação')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `megafort-catalogo-${new Date().toISOString().slice(0, 10)}.xlsx`
      anchor.click()
      URL.revokeObjectURL(url)
      toast.success('Excel exportado.')
    } catch {
      toast.error('Erro ao exportar a planilha.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-widest text-foreground sm:text-3xl">RELATÓRIOS E VENDAS</h1>
          <p className="font-body text-sm text-muted-foreground">Registros de vendas e métricas do catálogo.</p>
        </div>
        <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:flex">
          <RegisterSaleModal products={products} onSaved={load} />
          <button onClick={exportExcel} disabled={exporting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 font-display text-xs tracking-widest text-foreground transition hover:border-[var(--brand-primary)]/40 disabled:opacity-60">
            {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} EXPORTAR EXCEL
          </button>
        </div>
      </div>

      {loading || !data ? (
        <div className="flex h-48 items-center justify-center"><Loader2 size={28} className="animate-spin text-[var(--brand-primary)]" /></div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[
              { label: 'Vendas registradas', value: salesSummary.registered, icon: ReceiptText, color: 'text-[var(--brand-primary)]', background: 'bg-[var(--brand-primary)]/10' },
              { label: 'Receita dos registros', value: formatCurrency(salesSummary.revenue), icon: TrendingUp, color: 'text-sky-400', background: 'bg-sky-400/10' },
              { label: 'Valor em estoque', value: formatCurrency(data.totalStockValue), icon: BarChart3, color: 'text-orange-400', background: 'bg-orange-400/10' },
              { label: 'Cliques no catálogo', value: data.totalClicks, icon: MousePointerClick, color: 'text-pink-400', background: 'bg-pink-400/10' },
            ].map(card => {
              const Icon = card.icon
              return <div key={card.label} className="rounded-2xl border border-border bg-card p-4">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${card.background}`}><Icon size={18} className={card.color} /></div>
                <p className="font-body text-xs text-muted-foreground">{card.label}</p>
                <p className={`mt-1 font-display text-xl tracking-wide ${card.color}`}>{card.value}</p>
              </div>
            })}
          </section>

          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex flex-col gap-1 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="font-display text-lg tracking-widest text-foreground">REGISTROS DE VENDAS</h2><p className="font-body text-xs text-muted-foreground">As vendas são registradas aqui. O Financeiro consolida o resultado e as despesas.</p></div>
              <span className="font-mono text-xs text-[var(--brand-primary)]">Lucro bruto: {formatCurrency(salesSummary.grossProfit)}</span>
            </div>
            <div className="divide-y divide-border">
              {sales.map(sale => {
                const total = numberValue(sale.valor_venda) * sale.quantidade
                return <div key={sale.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center">
                  <div className="min-w-0"><p className="truncate font-body text-sm font-semibold text-foreground">{sale.produto?.nome || 'Produto removido'}</p><p className="font-body text-xs text-muted-foreground">{sale.canal_venda} · {new Date(sale.data_venda).toLocaleDateString('pt-BR')} · {sale.quantidade} un.</p></div>
                  <div className="text-right"><p className="font-mono text-sm text-foreground">{formatCurrency(total)}</p><p className="font-body text-[11px] text-muted-foreground">Venda</p></div>
                  <div className="hidden text-right sm:block"><p className="font-mono text-sm text-[var(--brand-primary)]">{formatCurrency(numberValue(sale.lucro_real))}</p><p className="font-body text-[11px] text-muted-foreground">Lucro bruto</p></div>
                </div>
              })}
              {sales.length === 0 && <div className="p-10 text-center"><ReceiptText size={30} className="mx-auto mb-3 text-muted-foreground/40" /><p className="font-body text-sm text-muted-foreground">Nenhuma venda registrada. Use “Registrar venda” para criar o primeiro registro.</p></div>}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5 xl:col-span-3">
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg tracking-widest text-foreground"><Calendar size={16} className="text-[var(--brand-primary)]" />CLIQUES — ÚLTIMOS 7 DIAS</h2>
              <div className="flex h-28 items-end gap-2">
                {data.dailyClicks.map((item: any) => {
                  const max = Math.max(...data.dailyClicks.map((value: any) => value.count), 1)
                  const percent = (item.count / max) * 100
                  return <div key={item.dia} className="flex min-w-0 flex-1 flex-col items-center gap-1"><span className="font-mono text-xs text-muted-foreground">{item.count}</span><div className="w-full rounded-t-md bg-[var(--brand-primary)]/80" style={{ height: `${Math.max(percent, 4)}%` }} /><span className="font-mono text-[9px] text-muted-foreground">{item.dia.slice(5)}</span></div>
                })}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card xl:col-span-1"><div className="flex items-center gap-2 border-b border-border p-4"><Eye size={15} className="text-[var(--brand-primary)]" /><h2 className="font-display text-base tracking-widest text-foreground">MAIS VISUALIZADOS</h2></div><div className="divide-y divide-border">{data.topView.map((product: any, index: number) => <div key={product.id} className="flex items-center gap-3 p-3"><span className={`w-5 text-center font-display text-lg ${index === 0 ? 'text-[var(--brand-primary)]' : 'text-muted-foreground'}`}>{index + 1}</span><p className="flex-1 truncate font-body text-sm text-foreground">{product.nome}</p><span className="font-mono text-xs text-muted-foreground">{product.visualizacoes}</span></div>)}{data.topView.length === 0 && <p className="p-4 text-center font-body text-sm text-muted-foreground">Sem dados.</p>}</div></div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card xl:col-span-2"><div className="flex items-center gap-2 border-b border-border p-4"><MousePointerClick size={15} className="text-pink-400" /><h2 className="font-display text-base tracking-widest text-foreground">MAIS CLICADOS NO WHATSAPP</h2></div><div className="divide-y divide-border">{data.topClicks.map((product: any, index: number) => <div key={product.id} className="flex items-center gap-3 p-3"><span className={`w-5 text-center font-display text-lg ${index === 0 ? 'text-pink-400' : 'text-muted-foreground'}`}>{index + 1}</span><p className="flex-1 truncate font-body text-sm text-foreground">{product.nome}</p><span className="font-mono text-xs text-pink-400">{product.cliques} cliques</span></div>)}{data.topClicks.length === 0 && <p className="p-4 text-center font-body text-sm text-muted-foreground">Sem cliques registrados.</p>}</div></div>
          </section>
        </>
      )}
    </div>
  )
}
