'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
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


const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function DashboardPage() {
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [recents, setRecents] = useState<any[]>([])
  const [topV,    setTopV]    = useState<TopProd[]>([])
  const [topC,    setTopC]    = useState<TopProd[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [
        { data: prods },
        { data: cats  },
        { data: mrcs  },
        { data: clks  },
        { data: rec   },
        { data: topViews },
      ] = await Promise.all([
        supabase.from('produtos').select('preco_compra,preco_venda,estoque,ativo,em_promocao,em_destaque'),
        supabase.from('categorias').select('id', { count: 'exact', head: true }),
        supabase.from('marcas').select('id', { count: 'exact', head: true }),
        supabase.from('click_tracking').select('criado_em').gte('criado_em', new Date(Date.now() - 7 * 86400000).toISOString()),
        supabase.from('produtos').select('id,nome,preco_venda,estoque,imagens:product_images(url)').eq('ativo', true).order('criado_em', { ascending: false }).limit(5),
        supabase.from('produtos').select('id,nome,visualizacoes').eq('ativo', true).order('visualizacoes', { ascending: false }).limit(5),
      ])

      const hoje = new Date().toISOString().slice(0, 10)
      const s: Stats = {
        total:        prods?.length || 0,
        ativos:       prods?.filter(p => p.ativo).length || 0,
        esgotados:    prods?.filter(p => p.estoque <= 0).length || 0,
        baixoEstoque: prods?.filter(p => p.estoque > 0 && p.estoque <= 5).length || 0,
        promocao:     prods?.filter(p => p.em_promocao).length || 0,
        destaque:     prods?.filter(p => p.em_destaque).length || 0,
        categorias:   (cats as any)?.length || 0,
        marcas:       (mrcs as any)?.length || 0,
        valorEstoque: prods?.reduce((a, p) => a + (p.preco_compra * p.estoque), 0) || 0,
        lucroTotal:   prods?.reduce((a, p) => a + ((p.preco_venda - p.preco_compra) * p.estoque), 0) || 0,
        clicksHoje:   clks?.filter(c => c.criado_em.slice(0, 10) === hoje).length || 0,
        clicksSemana: clks?.length || 0,
      }
      setStats(s)
      setRecents(rec || [])
      setTopV(topViews?.map(p => ({ id: p.id, nome: p.nome, visualizacoes: p.visualizacoes })) || [])

      // Top clicados
      const { data: topClk } = await supabase
        .from('click_tracking')
        .select('produto_id, produtos(id,nome)')
        .eq('tipo', 'whatsapp')
        .not('produto_id', 'is', null)
      const cMap: Record<string, { nome: string; count: number }> = {}
      topClk?.forEach((c: any) => {
        if (!c.produto_id) return
        cMap[c.produto_id] = cMap[c.produto_id] || { nome: c.produtos?.nome || '?', count: 0 }
        cMap[c.produto_id].count++
      })
      const sorted = Object.entries(cMap).sort((a, b) => b[1].count - a[1].count).slice(0, 5)
      setTopC(sorted.map(([id, v]) => ({ id, nome: v.nome, visualizacoes: v.count, cliques: v.count })))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const cards = stats ? [
    { label: 'Total Produtos',   value: stats.total,          icon: Package,         color: 'text-blue-400',   bg: 'bg-blue-400/10',    href: '/admin/produtos' },
    { label: 'Produtos Ativos',  value: stats.ativos,         icon: ShoppingBag,     color: 'text-green-400',  bg: 'bg-green-400/10',   href: '/admin/produtos' },
    { label: 'Esgotados',        value: stats.esgotados,      icon: AlertTriangle,   color: 'text-red-400',    bg: 'bg-red-400/10',     href: '/admin/estoque' },
    { label: 'Estoque Baixo',    value: stats.baixoEstoque,   icon: AlertTriangle,   color: 'text-orange-400', bg: 'bg-orange-400/10',  href: '/admin/estoque' },
    { label: 'Categorias',       value: stats.categorias,     icon: Tag,             color: 'text-purple-400', bg: 'bg-purple-400/10',  href: '/admin/categorias' },
    { label: 'Marcas',           value: stats.marcas,         icon: Award,           color: 'text-yellow-400', bg: 'bg-yellow-400/10',  href: '/admin/marcas' },
    { label: 'Valor em Estoque', value: formatCurrency(stats.valorEstoque), icon: DollarSign, color: 'text-cyan-400', bg: 'bg-cyan-400/10', href: '/admin/estoque' },
    { label: 'Lucro Potencial',  value: formatCurrency(stats.lucroTotal),   icon: TrendingUp, color: 'text-[var(--brand-primary)]', bg: 'bg-[var(--brand-primary)]/10', href: '/admin/relatorios' },
    { label: 'Cliques Hoje',     value: stats.clicksHoje,     icon: MousePointerClick, color: 'text-pink-400',  bg: 'bg-pink-400/10',  href: '/admin/relatorios' },
    { label: 'Cliques 7 dias',   value: stats.clicksSemana,   icon: MousePointerClick, color: 'text-indigo-400',bg: 'bg-indigo-400/10',href: '/admin/relatorios' },
  ] : []

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-foreground text-2xl md:text-3xl tracking-widest">DASHBOARD</h1>
          <p className="font-body text-muted-foreground text-sm mt-0.5">Visão geral da MegaFort</p>
        </div>
        <Link href="/admin/produtos/novo"
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--brand-button)] text-black font-display text-sm tracking-widest rounded-xl hover:opacity-90 transition-all">
          <Plus size={15} /> PRODUTO
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={28} className="text-[var(--brand-primary)] animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {cards.map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link href={card.href}
                  className="block p-4 bg-card border border-border rounded-2xl hover:border-[var(--brand-primary)]/20 transition-all group">
                  <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-2`}>
                    <card.icon size={16} className={card.color} />
                  </div>
                  <div className={`font-display text-2xl leading-none ${card.color}`}>{card.value}</div>
                  <div className="font-body text-muted-foreground text-xs tracking-wide mt-1">{card.label}</div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Alerts */}
          {stats && (stats.esgotados > 0 || stats.baixoEstoque > 0) && (
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-start gap-3">
              <AlertTriangle size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-body text-foreground text-sm font-semibold">Atenção no estoque!</p>
                <p className="font-body text-muted-foreground text-xs mt-0.5">
                  {stats.esgotados > 0 && `${stats.esgotados} produto(s) esgotado(s). `}
                  {stats.baixoEstoque > 0 && `${stats.baixoEstoque} produto(s) com estoque baixo.`}
                  {' '}<Link href="/admin/estoque" className="text-orange-400 hover:underline">Ver estoque →</Link>
                </p>
              </div>
            </div>
          )}

          {/* Tables row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recent */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-display text-foreground text-base tracking-widest">RECENTES</h2>
                <Link href="/admin/produtos" className="font-body text-xs text-[var(--brand-primary)] hover:underline">Ver todos</Link>
              </div>
              <div className="divide-y divide-border">
                {recents.map(p => (
                  <Link key={p.id} href={`/admin/produtos/${p.id}`}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-muted flex-shrink-0 overflow-hidden border border-border">
                      {p.imagens?.[0] ? <img src={p.imagens[0].url} className="w-full h-full object-cover" /> : <Package size={16} className="m-auto text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-foreground font-semibold truncate">{p.nome}</p>
                      <p className="font-body text-xs text-[var(--brand-primary)]">{formatCurrency(p.preco_venda)}</p>
                    </div>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getEstoqueStatus(p.estoque) === 'esgotado' ? 'bg-red-500' : getEstoqueStatus(p.estoque) === 'baixo' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                  </Link>
                ))}
              </div>
            </div>

            {/* Top viewed */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-display text-foreground text-base tracking-widest flex items-center gap-2"><Eye size={14} className="text-[var(--brand-primary)]" />MAIS VISTOS</h2>
              </div>
              <div className="divide-y divide-border">
                {topV.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 p-3">
                    <span className={`font-display text-lg w-5 text-center ${i === 0 ? 'text-[var(--brand-primary)]' : 'text-muted-foreground'}`}>{i + 1}</span>
                    <p className="flex-1 font-body text-sm text-foreground truncate">{p.nome}</p>
                    <span className="font-mono text-xs text-muted-foreground">{p.visualizacoes}</span>
                  </div>
                ))}
                {topV.length === 0 && <p className="p-4 text-center font-body text-muted-foreground text-sm">Sem dados ainda.</p>}
              </div>
            </div>

            {/* Top clicked (WhatsApp) */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-display text-foreground text-base tracking-widest flex items-center gap-2"><MousePointerClick size={14} className="text-green-400" />MAIS CLICADOS</h2>
              </div>
              <div className="divide-y divide-border">
                {topC.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 p-3">
                    <span className={`font-display text-lg w-5 text-center ${i === 0 ? 'text-green-400' : 'text-muted-foreground'}`}>{i + 1}</span>
                    <p className="flex-1 font-body text-sm text-foreground truncate">{p.nome}</p>
                    <span className="font-mono text-xs text-green-400">{p.cliques}</span>
                  </div>
                ))}
                {topC.length === 0 && <p className="p-4 text-center font-body text-muted-foreground text-sm">Sem cliques ainda.</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}
