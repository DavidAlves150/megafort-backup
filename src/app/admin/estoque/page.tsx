'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertTriangle, Package, Edit, Loader2, TrendingDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Produto, getEstoqueStatus } from '@/types'
import { formatCurrency, cn } from '@/lib/utils'
import { StockBadge } from '@/components/products/StockBadge'

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'todos'|'esgotados'|'baixo'|'urgente'>('todos')
  const [editId, setEditId] = useState<string|null>(null)
  const [novoEstoque, setNovoEstoque] = useState(0)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(()=>{ load() },[])

  async function load() {
    const { data } = await supabase.from('produtos')
      .select('*, categoria:categorias(nome), marca:marcas(nome), imagens:product_images(url,is_principal)')
      .eq('ativo', true).order('estoque', { ascending: true }).limit(200)
    setProdutos((data||[]) as any); setLoading(false)
  }

  async function saveEstoque(id:string) {
    setSaving(true)
    await supabase.from('produtos').update({ estoque: novoEstoque }).eq('id', id)
    setEditId(null); load(); setSaving(false)
  }

  const filtered = produtos.filter(p => {
    const s = getEstoqueStatus(p.estoque)
    if (filter==='todos') return true
    return s === filter
  })

  const counts = {
    esgotados: produtos.filter(p=>p.estoque<=0).length,
    urgente:   produtos.filter(p=>p.estoque>0&&p.estoque<=2).length,
    baixo:     produtos.filter(p=>p.estoque>0&&p.estoque<=5).length,
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-foreground text-2xl md:text-3xl tracking-widest">ESTOQUE</h1>
        <p className="font-body text-muted-foreground text-sm">{produtos.length} produto(s) no controle</p>
      </div>

      {/* Alert summary */}
      {(counts.esgotados > 0 || counts.urgente > 0 || counts.baixo > 0) && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:'Esgotados', count:counts.esgotados, color:'text-red-400', bg:'bg-red-400/10 border-red-400/20', filter:'esgotados' as const },
            { label:'Reposição urgente', count:counts.urgente, color:'text-orange-400', bg:'bg-orange-400/10 border-orange-400/20', filter:'urgente' as const },
            { label:'Estoque baixo', count:counts.baixo, color:'text-yellow-400', bg:'bg-yellow-400/10 border-yellow-400/20', filter:'baixo' as const },
          ].map(item=>(
            <button key={item.filter} onClick={()=>setFilter(f=>f===item.filter?'todos':item.filter)}
              className={cn('p-3 rounded-xl border text-center transition-all', item.bg, filter===item.filter&&'ring-2 ring-current')}>
              <div className={`font-display text-2xl ${item.color}`}>{item.count}</div>
              <div className={`font-body text-xs ${item.color} opacity-80`}>{item.label}</div>
            </button>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {[{k:'todos',l:'Todos'},{k:'esgotados',l:'🔴 Esgotados'},{k:'urgente',l:'🟠 Urgente'},{k:'baixo',l:'🟡 Baixo'}].map(f=>(
          <button key={f.k} onClick={()=>setFilter(f.k as any)}
            className={cn('flex-shrink-0 px-4 py-2 rounded-full font-body text-sm font-semibold border transition-all',
              filter===f.k?'bg-[var(--brand-primary)] text-black border-transparent':'bg-card border-border text-muted-foreground hover:border-[var(--brand-primary)]/30')}>
            {f.l}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? <div className="flex items-center justify-center h-32"><Loader2 size={24} className="text-[var(--brand-primary)] animate-spin"/></div>
        : filtered.length===0 ? <div className="py-12 text-center"><Package size={32} className="text-muted-foreground/30 mx-auto mb-2"/><p className="font-body text-muted-foreground text-sm">Nenhum produto neste filtro.</p></div>
        : (
          <div className="divide-y divide-border">
            {filtered.map((p,i)=>{
              const img = (p as any).imagens?.find((x:any)=>x.is_principal)?.url || (p as any).imagens?.[0]?.url
              return (
                <motion.div key={p.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}}
                  className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-muted border border-border flex-shrink-0 overflow-hidden">
                    {img?<img src={img} className="w-full h-full object-cover"/>:<Package size={14} className="m-auto text-muted-foreground"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-semibold text-foreground text-sm truncate">{p.nome}</p>
                    <StockBadge estoque={p.estoque} showCount size="sm"/>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {editId===p.id ? (
                      <>
                        <input type="number" min="0" value={novoEstoque} onChange={e=>setNovoEstoque(Number(e.target.value))}
                          className="w-16 form-input text-center py-1.5 text-sm h-8"/>
                        <button onClick={()=>saveEstoque(p.id)} disabled={saving}
                          className="px-3 h-8 bg-[var(--brand-primary)] text-black font-display text-xs tracking-widest rounded-lg hover:opacity-90 disabled:opacity-60 transition-all">
                          {saving?'...':'OK'}
                        </button>
                        <button onClick={()=>setEditId(null)} className="px-3 h-8 bg-muted border border-border text-muted-foreground font-display text-xs rounded-lg">✕</button>
                      </>
                    ) : (
                      <>
                        <span className="font-mono text-foreground text-sm font-bold">{p.estoque}</span>
                        <button onClick={()=>{ setEditId(p.id); setNovoEstoque(p.estoque) }}
                          className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center text-muted-foreground hover:text-[var(--brand-primary)] transition-colors">
                          <Edit size={12}/>
                        </button>
                      </>
                    )}
                    <Link href={`/admin/produtos/${p.id}`} className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center text-muted-foreground hover:text-[var(--brand-primary)] transition-colors">
                      <TrendingDown size={12}/>
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
