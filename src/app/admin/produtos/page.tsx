'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Trash2, Copy, Star, Zap, MoreVertical, Package, Filter, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Produto } from '@/types'
import { formatCurrency, getEstoqueStatus, cn } from '@/lib/utils'
import { StockBadge } from '@/components/products/StockBadge'
import toast from 'react-hot-toast'

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [menu, setMenu] = useState<string|null>(null)
  const supabase = createClient()

  useEffect(() => {
    const t = setTimeout(load, 260)
    return () => clearTimeout(t)
  }, [busca])

  async function load() {
    setLoading(true)
    let q = supabase.from('produtos')
      .select('*, categoria:categorias(nome), marca:marcas(nome), imagens:product_images(url,is_principal)')
      .order('criado_em', { ascending: false })
    if (busca) q = q.ilike('nome', `%${busca}%`)
    const { data } = await q.limit(100)
    setProdutos((data || []) as any)
    setLoading(false)
  }

  async function toggleField(id: string, field: string, val: boolean) {
    await supabase.from('produtos').update({ [field]: !val }).eq('id', id)
    load(); toast.success('Atualizado!')
  }

  async function duplicar(p: Produto) {
    const { id, criado_em, atualizado_em, slug, visualizacoes, ...rest } = p as any
    await supabase.from('produtos').insert([{ ...rest, nome: p.nome + ' (Cópia)', slug: p.slug + '-copia-' + Date.now() }])
    toast.success('Duplicado!'); load()
  }

  async function excluir(p: Produto) {
    if (!confirm(`Excluir "${p.nome}"?`)) return
    await supabase.from('produtos').delete().eq('id', p.id)
    toast.success('Excluído!'); load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-foreground text-2xl md:text-3xl tracking-widest">PRODUTOS</h1>
          <p className="font-body text-muted-foreground text-sm">{produtos.length} produto(s)</p>
        </div>
        <Link href="/admin/produtos/novo"
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--brand-button)] text-black font-display text-sm tracking-widest rounded-xl hover:opacity-90 transition-all">
          <Plus size={15}/> NOVO
        </Link>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"/>
        <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar produto..." className="form-input pl-10 h-11"/>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border">
            {[...Array(5)].map((_,i) => (
              <div key={i} className="p-4 flex items-center gap-3">
                <div className="skeleton w-11 h-11 rounded-xl"/>
                <div className="flex-1 space-y-2"><div className="skeleton h-4 w-2/3 rounded"/><div className="skeleton h-3 w-1/3 rounded"/></div>
              </div>
            ))}
          </div>
        ) : produtos.length === 0 ? (
          <div className="py-16 text-center">
            <Package size={40} className="text-muted-foreground/30 mx-auto mb-3"/>
            <p className="font-body text-muted-foreground">Nenhum produto. <Link href="/admin/produtos/novo" className="text-[var(--brand-primary)] hover:underline">Cadastrar agora</Link></p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {produtos.map((p, i) => {
              const img = (p as any).imagens?.find((x:any)=>x.is_principal)?.url || (p as any).imagens?.[0]?.url
              return (
                <motion.div key={p.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i*0.02 }}
                  className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-muted border border-border flex-shrink-0 overflow-hidden">
                    {img ? <img src={img} className="w-full h-full object-cover"/> : <Package size={16} className="m-auto text-muted-foreground"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link href={`/admin/produtos/${p.id}`} className="font-body font-semibold text-foreground text-sm hover:text-[var(--brand-primary)] transition-colors truncate max-w-[160px] sm:max-w-none">{p.nome}</Link>
                      {!p.ativo && <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-body rounded">INATIVO</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="font-body text-[var(--brand-primary)] text-xs font-semibold">{formatCurrency(p.preco_venda)}</span>
                      <StockBadge estoque={p.estoque} size="sm"/>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="hidden sm:flex items-center gap-1 font-mono text-muted-foreground text-xs"><Eye size={10}/>{p.visualizacoes}</span>
                    <button onClick={()=>toggleField(p.id,'em_destaque',p.em_destaque)}
                      className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-all', p.em_destaque?'bg-yellow-400/15 text-yellow-400':'bg-muted text-muted-foreground hover:text-yellow-400')}>
                      <Star size={12}/>
                    </button>
                    <button onClick={()=>toggleField(p.id,'em_promocao',p.em_promocao)}
                      className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-all', p.em_promocao?'bg-red-400/15 text-red-400':'bg-muted text-muted-foreground hover:text-red-400')}>
                      <Zap size={12}/>
                    </button>
                    <Link href={`/admin/produtos/${p.id}`} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-[var(--brand-primary)] transition-colors">
                      <Edit size={12}/>
                    </Link>
                    <div className="relative">
                      <button onClick={()=>setMenu(menu===p.id?null:p.id)} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <MoreVertical size={12}/>
                      </button>
                      {menu===p.id && (
                        <div className="absolute right-0 top-9 z-20 bg-card border border-border rounded-xl shadow-card py-1 min-w-[130px]" onMouseLeave={()=>setMenu(null)}>
                          <button onClick={()=>{toggleField(p.id,'ativo',p.ativo);setMenu(null)}} className="w-full px-4 py-2 text-left font-body text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">{p.ativo?'Desativar':'Ativar'}</button>
                          <button onClick={()=>{duplicar(p);setMenu(null)}} className="w-full px-4 py-2 text-left font-body text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2"><Copy size={11}/>Duplicar</button>
                          <button onClick={()=>{excluir(p);setMenu(null)}} className="w-full px-4 py-2 text-left font-body text-sm text-red-400 hover:bg-red-400/5 transition-colors flex items-center gap-2"><Trash2 size={11}/>Excluir</button>
                        </div>
                      )}
                    </div>
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
