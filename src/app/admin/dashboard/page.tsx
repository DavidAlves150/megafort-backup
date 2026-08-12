'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Package, TrendingUp, AlertTriangle, DollarSign, ShoppingBag, Tag, Award, Eye, MousePointerClick, Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { getEstoqueStatus } from '@/types'

interface Stats {
  total: number; ativos: number; esgotados: number; baixoEstoque: number
  promocao: number; destaque: number; categorias: number; marcas: number
  valorEstoque: number; lucroTotal: number; clicksHoje: number; clicksSemana: number
}

interface TopProd { id: string; nome: string; visualizacoes: number; cliques?: number }

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recents, setRecents] = useState<any[]>([])
  const [topV, setTopV] = useState<TopProd[]>([])
  const [topC, setTopC] = useState<TopProd[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const weekStart = new Date(Date.now() - 7 * 86400000).toISOString()
      const today = new Date().toISOString().slice(0, 10)
      const [
        { data: products },
        { count: categoryCount },
        { count: brandCount },
        { data: clicks },
        { data: recentProducts },
        { data: topViews },
        { data: topClicks },
      ] = await Promise.all([
        supabase.from('produtos').select('preco_compra,preco_venda,estoque,ativo,em_promocao,em_destaque'),
        supabase.from('categorias').select('id', { count: 'exact', head: true }),
        supabase.from('marcas').select('id', { count: 'exact', head: true }),
        supabase.from('click_tracking').select('criado_em').gte('criado_em', weekStart),
        supabase.from('produtos').select('id,nome,preco_venda,estoque,imagens:product_images(url,is_principal,ordem)').eq('ativo', true).order('criado_em', { ascending: false }).limit(5),
        supabase.from('produtos').select('id,nome,visualizacoes').eq('ativo', true).order('visualizacoes', { ascending: false }).limit(5),
        supabase.from('click_tracking').select('produto_id, produtos(id,nome)').eq('tipo', 'whatsapp').gte('criado_em', weekStart).not('produto_id', 'is', null),
      ])

      const productsList = products || []
      setStats({
        total: productsList.length,
        ativos: productsList.filter(product => product.ativo).length,
        esgotados: productsList.filter(product => product.estoque <= 0).length,
        baixoEstoque: productsList.filter(product => product.estoque > 0 && product.estoque <= 5).length,
        promocao: productsList.filter(product => product.em_promocao).length,
        destaque: productsList.filter(product => product.em_destaque).length,
        categorias: categoryCount || 0,
        marcas: brandCount || 0,
        valorEstoque: productsList.reduce((total, product) => total + (product.preco_compra * product.estoque), 0),
        lucroTotal: productsList.reduce((total, product) => total + ((product.preco_venda - product.preco_compra) * product.estoque), 0),
        clicksHoje: clicks?.filter(click => click.criado_em.slice(0, 10) === today).length || 0,
        clicksSemana: clicks?.length || 0,
      })
      setRecents(recentProducts || [])
      setTopV(topViews?.map(product => ({ id: product.id, nome: product.nome, visualizacoes: product.visualizacoes })) || [])

      const clickMap: Record<string, { nome: string; count: number }> = {}
      topClicks?.forEach((click: any) => {
        if (!click.produto_id) return
        clickMap[click.produto_id] = clickMap[click.produto_id] || { nome: click.produtos?.nome || '?', count: 0 }
        clickMap[click.produto_id].count += 1
      })
      setTopC(Object.entries(clickMap).sort(([, first], [, second]) => second.count - first.count).slice(0, 5).map(([id, value]) => ({ id, nome: value.nome, visualizacoes: value.count, cliques: value.count })))
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { load() }, [load])

  const cards = stats ? [
    { label: 'Total Produtos', value: stats.total, icon: Package, color: 'text-blue-400', bg: 'bg-blue-400/10', href: '/admin/produtos' },
    { label: 'Produtos Ativos', value: stats.ativos, icon: ShoppingBag, color: 'text-green-400', bg: 'bg-green-400/10', href: '/admin/produtos' },
    { label: 'Esgotados', value: stats.esgotados, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-400/10', href: '/admin/estoque' },
    { label: 'Estoque Baixo', value: stats.baixoEstoque, icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-400/10', href: '/admin/estoque' },
    { label: 'Categorias', value: stats.categorias, icon: Tag, color: 'text-purple-400', bg: 'bg-purple-400/10', href: '/admin/categorias' },
    { label: 'Marcas', value: stats.marcas, icon: Award, color: 'text-yellow-400', bg: 'bg-yellow-400/10', href: '/admin/marcas' },
    { label: 'Valor em Estoque', value: formatCurrency(stats.valorEstoque), icon: DollarSign, color: 'text-cyan-400', bg: 'bg-cyan-400/10', href: '/admin/estoque' },
    { label: 'Lucro Potencial', value: formatCurrency(stats.lucroTotal), icon: TrendingUp, color: 'text-[var(--brand-primary)]', bg: 'bg-[var(--brand-primary)]/10', href: '/admin/relatorios' },
    { label: 'Cliques Hoje', value: stats.clicksHoje, icon: MousePointerClick, color: 'text-pink-400', bg: 'bg-pink-400/10', href: '/admin/relatorios' },
    { label: 'Cliques 7 dias', value: stats.clicksSemana, icon: MousePointerClick, color: 'text-indigo-400', bg: 'bg-indigo-400/10', href: '/admin/relatorios' },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-widest text-foreground md:text-3xl">DASHBOARD</h1>
          <p className="mt-0.5 font-body text-sm text-muted-foreground">Visão geral da MegaFort</p>
        </div>
        <Link href="/admin/produtos/novo" className="flex items-center gap-2 rounded-xl bg-[var(--brand-button)] px-4 py-2.5 font-display text-sm tracking-widest text-black transition hover:opacity-90">
          <Plus size={15} /> PRODUTO
        </Link>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 size={28} className="animate-spin text-[var(--brand-primary)]" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {cards.map(card => (
              <Link key={card.label} href={card.href} className="group block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-[var(--brand-primary)]/20">
                <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${card.bg}`}><card.icon size={16} className={card.color} /></div>
                <div className={`font-display text-2xl leading-none ${card.color}`}>{card.value}</div>
                <div className="mt-1 font-body text-xs tracking-wide text-muted-foreground">{card.label}</div>
              </Link>
            ))}
          </div>

          {stats && (stats.esgotados > 0 || stats.baixoEstoque > 0) && (
            <div className="flex items-start gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-orange-400" />
              <div>
                <p className="font-body text-sm font-semibold text-foreground">Atenção no estoque!</p>
                <p className="mt-0.5 font-body text-xs text-muted-foreground">{stats.esgotados > 0 && `${stats.esgotados} produto(s) esgotado(s). `}{stats.baixoEstoque > 0 && `${stats.baixoEstoque} produto(s) com estoque baixo.`} <Link href="/admin/estoque" className="text-orange-400 hover:underline">Ver estoque →</Link></p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <section className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border p-4"><h2 className="font-display text-base tracking-widest text-foreground">RECENTES</h2><Link href="/admin/produtos" className="font-body text-xs text-[var(--brand-primary)] hover:underline">Ver todos</Link></div>
              <div className="divide-y divide-border">
                {recents.map(product => {
                  const image = product.imagens?.find((item: any) => item.is_principal)?.url || product.imagens?.[0]?.url
                  return <Link key={product.id} href={`/admin/produtos/${product.id}`} className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50"><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">{image ? <img src={image} alt={product.nome} className="h-full w-full object-cover" loading="lazy" /> : <Package size={16} className="text-muted-foreground" />}</div><div className="min-w-0 flex-1"><p className="truncate font-body text-sm font-semibold text-foreground">{product.nome}</p><p className="font-body text-xs text-[var(--brand-primary)]">{formatCurrency(product.preco_venda)}</p></div><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${getEstoqueStatus(product.estoque) === 'esgotado' ? 'bg-red-500' : getEstoqueStatus(product.estoque) === 'baixo' ? 'bg-yellow-500' : 'bg-green-500'}`} /></Link>
                })}
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border p-4"><h2 className="flex items-center gap-2 font-display text-base tracking-widest text-foreground"><Eye size={14} className="text-[var(--brand-primary)]" />MAIS VISTOS</h2></div><Ranking products={topV} tone="text-muted-foreground" /></section>
            <section className="overflow-hidden rounded-2xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border p-4"><h2 className="flex items-center gap-2 font-display text-base tracking-widest text-foreground"><MousePointerClick size={14} className="text-green-400" />MAIS CLICADOS (7 DIAS)</h2></div><Ranking products={topC} tone="text-green-400" clicks /></section>
          </div>
        </>
      )}
    </div>
  )
}

function Ranking({ products, tone, clicks = false }: { products: TopProd[]; tone: string; clicks?: boolean }) {
  if (products.length === 0) return <p className="p-4 text-center font-body text-sm text-muted-foreground">Sem dados ainda.</p>
  return <div className="divide-y divide-border">{products.map((product, index) => <div key={product.id} className="flex items-center gap-3 p-3"><span className={`w-5 text-center font-display text-lg ${index === 0 ? tone : 'text-muted-foreground'}`}>{index + 1}</span><p className="flex-1 truncate font-body text-sm text-foreground">{product.nome}</p><span className={`font-mono text-xs ${clicks ? tone : 'text-muted-foreground'}`}>{clicks ? product.cliques : product.visualizacoes}</span></div>)}</div>
}
