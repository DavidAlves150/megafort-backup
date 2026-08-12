'use client'

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, X, Filter } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductSkeleton } from '@/components/products/ProductSkeleton'
import { createClient } from '@/lib/supabase/client'
import { Produto, Categoria, Marca } from '@/types'
import { cn } from '@/lib/utils'

const CATALOG_PRODUCT_SELECT = `
  id,nome,slug,preco_venda,preco_promocional,estoque,em_destaque,em_promocao,criado_em,
  categoria:categorias(nome,slug),
  marca:marcas(nome,slug),
  imagens:product_images(url,is_principal,ordem),
  videos:product_videos(id)
`

function CatalogContent() {
  const searchParams = useSearchParams()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [filtersReady, setFiltersReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showFilter, setShowFilter] = useState(false)
  const [busca, setBusca] = useState(searchParams.get('busca') || '')
  const [catSlug, setCatSlug] = useState(searchParams.get('categoria') || '')
  const [marcaSlug, setMarcaSlug] = useState(searchParams.get('marca') || '')
  const [soPromo, setSoPromo] = useState(searchParams.get('promocao') === 'true')
  const [soDestaque, setSoDestaque] = useState(searchParams.get('destaque') === 'true')
  const requestId = useRef(0)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let active = true

    async function loadFilters() {
      const [{ data: cats }, { data: mrcs }] = await Promise.all([
        supabase.from('categorias').select('id,nome,slug,descricao,imagem_url,cor,ordem,ativa,criado_em,atualizado_em').eq('ativa', true).order('ordem'),
        supabase.from('marcas').select('id,nome,slug,descricao,logo_url,site_url,ativa,criado_em,atualizado_em').eq('ativa', true).order('nome'),
      ])

      if (!active) return
      setCategorias((cats || []) as Categoria[])
      setMarcas((mrcs || []) as Marca[])
      setFiltersReady(true)
    }

    loadFilters()
    return () => { active = false }
  }, [supabase])

  const loadProdutos = useCallback(async () => {
    const currentRequest = ++requestId.current
    setLoading(true)

    const categoryId = catSlug ? categorias.find(category => category.slug === catSlug)?.id : undefined
    const brandId = marcaSlug ? marcas.find(brand => brand.slug === marcaSlug)?.id : undefined

    let query = supabase
      .from('produtos')
      .select(CATALOG_PRODUCT_SELECT)
      .eq('ativo', true)
      .order('criado_em', { ascending: false })
      .limit(48)

    if (busca.trim()) query = query.ilike('nome', `%${busca.trim()}%`)
    if (soPromo) query = query.eq('em_promocao', true)
    if (soDestaque) query = query.eq('em_destaque', true)
    if (categoryId) query = query.eq('categoria_id', categoryId)
    if (brandId) query = query.eq('marca_id', brandId)

    const { data } = await query
    if (currentRequest !== requestId.current) return

    setProdutos((data || []) as unknown as Produto[])
    setLoading(false)
  }, [busca, catSlug, categorias, marcaSlug, marcas, soDestaque, soPromo, supabase])

  useEffect(() => {
    if (!filtersReady) return

    const wait = busca ? 220 : 0
    const timeout = window.setTimeout(loadProdutos, wait)
    return () => window.clearTimeout(timeout)
  }, [busca, filtersReady, loadProdutos])

  const hasFilter = !!(busca || catSlug || marcaSlug || soPromo || soDestaque)
  const clearAll = () => { setBusca(''); setCatSlug(''); setMarcaSlug(''); setSoPromo(false); setSoDestaque(false) }
  const catLabel = categorias.find(category => category.slug === catSlug)?.nome
  const marcaLabel = marcas.find(brand => brand.slug === marcaSlug)?.nome

  return (
    <>
      <Header />
      <main className="min-h-screen pt-16">
        <div className="border-b border-border bg-surface-2 px-4 py-6">
          <div className="mx-auto max-w-7xl">
            <h1 className="font-display text-3xl tracking-widest text-foreground md:text-4xl">
              {catLabel ? catLabel.toUpperCase() : marcaLabel ? marcaLabel.toUpperCase() : soPromo ? 'PROMOÇÕES' : 'CATÁLOGO'}
            </h1>
            <p className="mt-1 font-body text-sm text-muted-foreground">
              {loading ? 'Carregando...' : `${produtos.length} produto(s) encontrado(s)`}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={busca} onChange={event => setBusca(event.target.value)} placeholder="Buscar produtos..." className="form-input h-11 pl-10" />
            </div>
            <button onClick={() => setShowFilter(!showFilter)} className={cn('flex h-11 items-center gap-2 rounded-xl border px-4 font-body text-sm font-semibold transition-all', showFilter ? 'border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]' : 'border-border bg-card text-foreground hover:border-[var(--brand-primary)]/30')}>
              <SlidersHorizontal size={15} />
              <span className="hidden sm:inline">Filtros</span>
              {hasFilter && <span className="h-2 w-2 rounded-full bg-[var(--brand-primary)]" />}
            </button>
          </div>

          {showFilter && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }} className="mb-4 space-y-4 rounded-2xl border border-border bg-card p-4">
              <div>
                <p className="form-label">Categoria</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setCatSlug('')} className={cn('rounded-full border px-3 py-1.5 font-body text-xs font-semibold transition-all', !catSlug ? 'border-transparent bg-[var(--brand-primary)] text-black' : 'border-border bg-muted text-muted-foreground hover:border-[var(--brand-primary)]/30')}>Todas</button>
                  {categorias.map(category => (
                    <button key={category.id} onClick={() => setCatSlug(catSlug === category.slug ? '' : category.slug)} className={cn('rounded-full border px-3 py-1.5 font-body text-xs font-semibold transition-all', catSlug === category.slug ? 'border-transparent bg-[var(--brand-primary)] text-black' : 'border-border bg-muted text-muted-foreground hover:border-[var(--brand-primary)]/30')}>
                      {category.nome}
                    </button>
                  ))}
                </div>
              </div>

              {marcas.length > 0 && (
                <div>
                  <p className="form-label">Marca</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setMarcaSlug('')} className={cn('rounded-full border px-3 py-1.5 font-body text-xs font-semibold transition-all', !marcaSlug ? 'border-transparent bg-[var(--brand-primary)] text-black' : 'border-border bg-muted text-muted-foreground hover:border-[var(--brand-primary)]/30')}>Todas</button>
                    {marcas.map(brand => (
                      <button key={brand.id} onClick={() => setMarcaSlug(marcaSlug === brand.slug ? '' : brand.slug)} className={cn('rounded-full border px-3 py-1.5 font-body text-xs font-semibold transition-all', marcaSlug === brand.slug ? 'border-transparent bg-[var(--brand-primary)] text-black' : 'border-border bg-muted text-muted-foreground hover:border-[var(--brand-primary)]/30')}>
                        {brand.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Promoções', active: soPromo, toggle: () => setSoPromo(!soPromo) },
                  { label: 'Destaques', active: soDestaque, toggle: () => setSoDestaque(!soDestaque) },
                ].map(filter => (
                  <button key={filter.label} onClick={filter.toggle} className={cn('rounded-full border px-3 py-1.5 font-body text-xs font-semibold transition-all', filter.active ? 'border-transparent bg-[var(--brand-primary)] text-black' : 'border-border bg-muted text-muted-foreground')}>
                    {filter.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {hasFilter && (
            <div className="mb-4 flex flex-wrap gap-2">
              {catLabel && <Chip label={catLabel} onRemove={() => setCatSlug('')} />}
              {marcaLabel && <Chip label={marcaLabel} onRemove={() => setMarcaSlug('')} />}
              {busca && <Chip label={`"${busca}"`} onRemove={() => setBusca('')} />}
              {soPromo && <Chip label="Promoção" onRemove={() => setSoPromo(false)} />}
              {soDestaque && <Chip label="Destaque" onRemove={() => setSoDestaque(false)} />}
              <button onClick={clearAll} className="font-body text-xs text-muted-foreground transition-colors hover:text-red-400">Limpar tudo</button>
            </div>
          )}

          {loading ? <ProductSkeleton count={8} /> : produtos.length === 0 ? (
            <div className="py-20 text-center">
              <Filter size={40} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-body text-lg text-muted-foreground">Nenhum produto encontrado.</p>
              <button onClick={clearAll} className="mt-3 font-body text-sm text-[var(--brand-primary)] hover:underline">Limpar filtros</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {produtos.map((product, index) => <ProductCard key={product.id} produto={product} index={index} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/10 px-3 py-1.5 font-body text-xs font-semibold text-[var(--brand-primary)]">
      {label}
      <button onClick={onRemove} className="transition-colors hover:text-red-400" aria-label={`Remover filtro ${label}`}><X size={11} /></button>
    </span>
  )
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" /></div>}>
      <CatalogContent />
    </Suspense>
  )
}
