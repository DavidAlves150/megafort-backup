'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Eye, MousePointerClick, Download, Loader2, TrendingUp, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function RelatoriosPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const supabase = createClient()

  useEffect(()=>{ load() },[])

  async function load() {
    const [
      { data: topView },
      { data: clicks },
      { data: prods },
    ] = await Promise.all([
      supabase.from('produtos').select('id,nome,visualizacoes,preco_venda,imagens:product_images(url,is_principal)').eq('ativo',true).order('visualizacoes',{ascending:false}).limit(10),
      supabase.from('click_tracking').select('produto_id,tipo,criado_em,produto:produtos(nome)').order('criado_em',{ascending:false}).limit(500),
      supabase.from('produtos').select('id,nome,preco_compra,preco_venda,estoque,em_promocao,ativo').limit(500),
    ])

    // Aggregate clicks by produto
    const clickMap: Record<string,{nome:string,count:number}> = {}
    clicks?.forEach((c:any)=>{
      if (!c.produto_id) return
      clickMap[c.produto_id] = clickMap[c.produto_id] || {nome:c.produto?.nome||'?',count:0}
      clickMap[c.produto_id].count++
    })
    const topClicks = Object.entries(clickMap).sort((a,b)=>b[1].count-a[1].count).slice(0,10)
      .map(([id,v])=>({id,nome:v.nome,cliques:v.count}))

    // Daily clicks (last 7 days)
    const hoje = new Date()
    const dailyClicks = Array.from({length:7},(_,i)=>{
      const d = new Date(hoje); d.setDate(d.getDate()-i)
      const key = d.toISOString().slice(0,10)
      return { dia: key, count: clicks?.filter(c=>c.criado_em.slice(0,10)===key).length||0 }
    }).reverse()

    // Financials
    const totalLucro = prods?.reduce((a,p)=>{
      const lucro = (p.preco_venda - p.preco_compra) * p.estoque
      return a + lucro
    },0)||0
    const totalEstoque = prods?.reduce((a,p)=>a+(p.preco_compra*p.estoque),0)||0

    setData({ topView: topView||[], topClicks, dailyClicks, totalLucro, totalEstoque, totalClicks: clicks?.length||0 })
    setLoading(false)
  }

  async function exportExcel() {
    setExporting(true)
    try {
      const res = await fetch('/api/export-excel')
      if (!res.ok) throw new Error('Erro')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `megafort-catalogo-${new Date().toISOString().slice(0,10)}.xlsx`
      a.click(); URL.revokeObjectURL(url)
      toast.success('Excel exportado!')
    } catch { toast.error('Erro ao exportar.') }
    finally { setExporting(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-foreground text-2xl md:text-3xl tracking-widest">RELATÓRIOS</h1>
          <p className="font-body text-muted-foreground text-sm">Analytics da sua loja</p>
        </div>
        <button onClick={exportExcel} disabled={exporting}
          className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border text-foreground font-display text-sm tracking-widest rounded-xl hover:border-[var(--brand-primary)]/30 disabled:opacity-60 transition-all">
          {exporting?<Loader2 size={14} className="animate-spin"/>:<Download size={14}/>}
          EXPORTAR EXCEL
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 size={28} className="text-[var(--brand-primary)] animate-spin"/></div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              {label:'Lucro Potencial',value:formatCurrency(data.totalLucro),icon:TrendingUp,color:'text-[var(--brand-primary)]',bg:'bg-[var(--brand-primary)]/10'},
              {label:'Valor em Estoque',value:formatCurrency(data.totalEstoque),icon:BarChart3,color:'text-blue-400',bg:'bg-blue-400/10'},
              {label:'Total de Cliques',value:data.totalClicks,icon:MousePointerClick,color:'text-pink-400',bg:'bg-pink-400/10'},
            ].map(c=>(
              <div key={c.label} className="bg-card border border-border rounded-2xl p-4">
                <div className={`w-9 h-9 ${c.bg} rounded-xl flex items-center justify-center mb-2`}><c.icon size={16} className={c.color}/></div>
                <div className={`font-display text-xl leading-none ${c.color}`}>{c.value}</div>
                <div className="font-body text-muted-foreground text-xs mt-1">{c.label}</div>
              </div>
            ))}
          </div>

          {/* Daily clicks */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-display text-foreground text-lg tracking-widest mb-4 flex items-center gap-2"><Calendar size={16} className="text-[var(--brand-primary)]"/>CLIQUES - ÚLTIMOS 7 DIAS</h2>
            <div className="flex items-end gap-2 h-24">
              {data.dailyClicks.map((d:any)=>{
                const max = Math.max(...data.dailyClicks.map((x:any)=>x.count),1)
                const pct = (d.count/max)*100
                return (
                  <div key={d.dia} className="flex-1 flex flex-col items-center gap-1">
                    <span className="font-mono text-xs text-muted-foreground">{d.count}</span>
                    <div className="w-full bg-muted rounded-t-md transition-all" style={{height:`${Math.max(pct,4)}%`,background:'var(--brand-primary)',opacity:0.7+pct*0.003}}/>
                    <span className="font-mono text-[9px] text-muted-foreground">{d.dia.slice(5)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top viewed */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <Eye size={14} className="text-[var(--brand-primary)]"/>
                <h2 className="font-display text-foreground text-base tracking-widest">MAIS VISUALIZADOS</h2>
              </div>
              <div className="divide-y divide-border">
                {data.topView.map((p:any,i:number)=>{
                  const img = p.imagens?.find((x:any)=>x.is_principal)?.url || p.imagens?.[0]?.url
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-3">
                      <span className={`font-display text-lg w-5 text-center flex-shrink-0 ${i===0?'text-[var(--brand-primary)]':'text-muted-foreground'}`}>{i+1}</span>
                      {img&&<img src={img} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-border"/>}
                      <p className="flex-1 font-body text-foreground text-sm truncate">{p.nome}</p>
                      <span className="font-mono text-xs text-muted-foreground flex-shrink-0">{p.visualizacoes} views</span>
                    </div>
                  )
                })}
                {data.topView.length===0&&<p className="p-4 text-center font-body text-muted-foreground text-sm">Sem dados.</p>}
              </div>
            </div>

            {/* Top clicked */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <MousePointerClick size={14} className="text-green-400"/>
                <h2 className="font-display text-foreground text-base tracking-widest">MAIS CLICADOS (WHATSAPP)</h2>
              </div>
              <div className="divide-y divide-border">
                {data.topClicks.map((p:any,i:number)=>(
                  <div key={p.id} className="flex items-center gap-3 p-3">
                    <span className={`font-display text-lg w-5 text-center flex-shrink-0 ${i===0?'text-green-400':'text-muted-foreground'}`}>{i+1}</span>
                    <p className="flex-1 font-body text-foreground text-sm truncate">{p.nome}</p>
                    <span className="font-mono text-xs text-green-400 flex-shrink-0">{p.cliques} cliques</span>
                  </div>
                ))}
                {data.topClicks.length===0&&<p className="p-4 text-center font-body text-muted-foreground text-sm">Sem cliques registrados.</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
