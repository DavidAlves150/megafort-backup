'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Copy, Edit, Eye, MoreVertical, Package, Plus, Search, Star, Trash2, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Produto } from '@/types'
import { cn, formatCurrency } from '@/lib/utils'
import { StockBadge } from '@/components/products/StockBadge'
import toast from 'react-hot-toast'

const ADMIN_PRODUCT_SELECT = 'id,nome,slug,preco_venda,estoque,ativo,em_destaque,em_promocao,visualizacoes,criado_em,categoria:categorias(nome),marca:marcas(nome),imagens:product_images(url,is_principal)'

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [menu, setMenu] = useState<string | null>(null)
  const requestId = useRef(0)
  const supabase = useMemo(() => createClient(), [])

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current
    setLoading(true)

    let query = supabase.from('produtos').select(ADMIN_PRODUCT_SELECT).order('criado_em', { ascending: false })
    if (busca.trim()) query = query.ilike('nome', `%${busca.trim()}%`)

    const { data, error } = await query.limit(60)
    if (currentRequest !== requestId.current) return
    if (error) toast.error(error.message)
    setProdutos((data || []) as unknown as Produto[])
    setLoading(false)
  }, [busca, supabase])

  useEffect(() => {
    const wait = busca ? 220 : 0
    const timeout = window.setTimeout(load, wait)
    return () => window.clearTimeout(timeout)
  }, [busca, load])

  async function toggleField(id: string, field: 'em_destaque' | 'em_promocao' | 'ativo', value: boolean) {
    const nextValue = !value
    const { error } = await supabase.from('produtos').update({ [field]: nextValue }).eq('id', id)
    if (error) return toast.error(error.message)

    setProdutos(current => current.map(product => product.id === id ? { ...product, [field]: nextValue } : product))
    toast.success('Produto atualizado.')
  }

  async function duplicar(product: Produto) {
    const { data: original, error: readError } = await supabase.from('produtos').select('*').eq('id', product.id).single()
    if (readError || !original) return toast.error(readError?.message || 'Produto não encontrado.')

    const { id, criado_em, atualizado_em, slug, visualizacoes, ...rest } = original
    const { data: copy, error } = await supabase
      .from('produtos')
      .insert([{ ...rest, nome: `${product.nome} (Cópia)`, slug: `${product.slug}-copia-${Date.now()}` }])
      .select(ADMIN_PRODUCT_SELECT)
      .single()

    if (error) return toast.error(error.message)
    if (copy) setProdutos(current => [copy as unknown as Produto, ...current])
    toast.success('Produto duplicado.')
  }

  async function excluir(product: Produto) {
    if (!confirm(`Excluir “${product.nome}”?`)) return
    const { error } = await supabase.from('produtos').delete().eq('id', product.id)
    if (error) return toast.error(error.message)

    setProdutos(current => current.filter(item => item.id !== product.id))
    toast.success('Produto excluído.')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-widest text-foreground md:text-3xl">PRODUTOS</h1>
          <p className="font-body text-sm text-muted-foreground">{produtos.length} produto(s)</p>
        </div>
        <Link href="/admin/produtos/novo" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--brand-button)] px-4 py-2.5 font-display text-sm tracking-widest text-black transition hover:opacity-90">
          <Plus size={17} /> NOVO PRODUTO
        </Link>
      </div>

      <div className="relative">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={busca} onChange={event => setBusca(event.target.value)} placeholder="Buscar produto..." className="form-input h-12 pl-10" />
      </div>

      <div className="overflow-visible rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="divide-y divide-border">{[...Array(5)].map((_, index) => <div key={index} className="flex items-center gap-3 p-4"><div className="skeleton h-12 w-12 shrink-0 rounded-xl" /><div className="flex-1 space-y-2"><div className="skeleton h-4 w-2/3 rounded" /><div className="skeleton h-3 w-1/3 rounded" /></div></div>)}</div>
        ) : produtos.length === 0 ? (
          <div className="py-16 text-center"><Package size={40} className="mx-auto mb-3 text-muted-foreground/30" /><p className="font-body text-muted-foreground">Nenhum produto. <Link href="/admin/produtos/novo" className="text-[var(--brand-primary)] hover:underline">Cadastrar agora</Link></p></div>
        ) : (
          <div className="divide-y divide-border">
            {produtos.map(product => {
              const image = (product as any).imagens?.find((item: any) => item.is_principal)?.url || (product as any).imagens?.[0]?.url
              const isMenuOpen = menu === product.id
              return (
                <article key={product.id} className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3 p-4 transition-colors hover:bg-muted/20 sm:grid-cols-[3.25rem_minmax(0,1fr)_auto] sm:items-center">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                    {image ? <img src={image} alt={product.nome} className="h-full w-full object-cover" loading="lazy" /> : <Package size={18} className="text-muted-foreground" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link href={`/admin/produtos/${product.id}`} className="min-w-0 break-words font-body text-sm font-semibold text-foreground transition hover:text-[var(--brand-primary)]">{product.nome}</Link>
                      {!product.ativo && <span className="rounded border border-red-400/30 bg-red-400/10 px-1.5 py-0.5 font-body text-[10px] text-red-400">INATIVO</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2"><span className="font-body text-sm font-semibold text-[var(--brand-primary)]">{formatCurrency(product.preco_venda)}</span><StockBadge estoque={product.estoque} size="sm" /><span className="hidden items-center gap-1 font-mono text-xs text-muted-foreground sm:flex"><Eye size={11} />{product.visualizacoes}</span></div>
                  </div>

                  <div className="col-span-2 grid grid-cols-4 gap-2 border-t border-border/70 pt-3 sm:col-span-1 sm:flex sm:border-0 sm:pt-0">
                    <button type="button" onClick={() => toggleField(product.id, 'em_destaque', product.em_destaque)} className={cn('flex h-11 items-center justify-center rounded-xl transition-all sm:w-11', product.em_destaque ? 'bg-yellow-400/15 text-yellow-400' : 'bg-muted text-muted-foreground hover:text-yellow-400')} aria-label="Alternar destaque"><Star size={16} /></button>
                    <button type="button" onClick={() => toggleField(product.id, 'em_promocao', product.em_promocao)} className={cn('flex h-11 items-center justify-center rounded-xl transition-all sm:w-11', product.em_promocao ? 'bg-red-400/15 text-red-400' : 'bg-muted text-muted-foreground hover:text-red-400')} aria-label="Alternar promoção"><Zap size={16} /></button>
                    <Link href={`/admin/produtos/${product.id}`} className="flex h-11 items-center justify-center rounded-xl bg-muted text-muted-foreground transition hover:text-[var(--brand-primary)]" aria-label={`Editar ${product.nome}`}><Edit size={16} /></Link>
                    <div className="relative">
                      <button type="button" onClick={() => setMenu(isMenuOpen ? null : product.id)} className="flex h-11 w-full items-center justify-center rounded-xl bg-muted text-muted-foreground transition hover:text-foreground sm:w-11" aria-label="Mais ações"><MoreVertical size={17} /></button>
                      {isMenuOpen && <div className="absolute right-0 top-12 z-30 min-w-44 rounded-xl border border-border bg-card py-1 shadow-xl"><button type="button" onClick={() => { toggleField(product.id, 'ativo', product.ativo); setMenu(null) }} className="min-h-11 w-full px-4 text-left font-body text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground">{product.ativo ? 'Desativar' : 'Ativar'}</button><button type="button" onClick={() => { duplicar(product); setMenu(null) }} className="flex min-h-11 w-full items-center gap-2 px-4 text-left font-body text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"><Copy size={14} />Duplicar</button><button type="button" onClick={() => { excluir(product); setMenu(null) }} className="flex min-h-11 w-full items-center gap-2 px-4 text-left font-body text-sm text-red-400 transition hover:bg-red-400/5"><Trash2 size={14} />Excluir</button></div>}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
