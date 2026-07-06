'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, X, Filter } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductSkeleton } from '@/components/products/ProductSkeleton'
import { StockBadge } from '@/components/products/StockBadge'
import { createClient } from '@/lib/supabase/client'
import { Produto, Categoria, Marca } from '@/types'
import { cn } from '@/lib/utils'

function CatalogContent() {
  const searchParams = useSearchParams()
  const [produtos,   setProdutos]   = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [marcas,     setMarcas]     = useState<Marca[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showFilter, setShowFilter] = useState(false)
  const [busca,      setBusca]      = useState(searchParams.get('busca') || '')
  const [catSlug,    setCatSlug]    = useState(searchParams.get('categoria') || '')
  const [marcaSlug,  setMarcaSlug]  = useState(searchParams.get('marca') || '')
  const [soPromo,    setSoPromo]    = useState(searchParams.get('promocao') === 'true')
  const [soDestaque, setSoDestaque] = useState(searchParams.get('destaque') === 'true')
  const supabase = createClient()

  useEffect(() => {
    async function loadFilters() {
      const [{ data: cats }, { data: mrcs }] = await Promise.all([
        supabase.from('categorias').select('*').eq('ativa', true).order('ordem'),
        supabase.from('marcas').select('*').eq('ativa', true).order('nome'),
      ])
      setCategorias(cats || [])
      setMarcas(mrcs || [])
    }
    loadFilters()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => loadProdutos(), 280)
    return () => clearTimeout(t)
  }, [busca, catSlug, marcaSlug, soPromo, soDestaque])

  async function loadProdutos() {
    setLoading(true)
    let q = supabase
      .from('produtos')
      .select('*, categoria:categorias(nome,slug), marca:marcas(nome,slug), imagens:product_images(url,is_principal,ordem), videos:product_videos(url,tipo,ordem)')
      .eq('ativo', true)
      .order('criado_em', { ascending: false })
      .limit(60)

    if (busca)      q = q.ilike('nome', `%${busca}%`)
    if (soPromo)    q = q.eq('em_promocao', true)
    if (soDestaque) q = q.eq('em_destaque', true)

    if (catSlug) {
      const { data: cat } = await supabase.from('categorias').select('id').eq('slug', catSlug).single()
      if (cat) q = q.eq('categoria_id', cat.id)
    }
    if (marcaSlug) {
      const { data: marca } = await supabase.from('marcas').select('id').eq('slug', marcaSlug).single()
      if (marca) q = q.eq('marca_id', marca.id)
    }

    const { data } = await q
    setProdutos((data || []) as unknown as Produto[])
    setLoading(false)
  }

  const hasFilter = !!(busca || catSlug || marcaSlug || soPromo || soDestaque)
  const clearAll  = () => { setBusca(''); setCatSlug(''); setMarcaSlug(''); setSoPromo(false); setSoDestaque(false) }
  const catLabel  = categorias.find(c => c.slug === catSlug)?.nome
  const marcaLabel= marcas.find(m => m.slug === marcaSlug)?.nome

  return (
    <>
      <Header />
      <main className="min-h-screen pt-16">
        {/* Page title */}
        <div className="bg-surface-2 border-b border-border px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="font-display text-foreground text-3xl md:text-4xl tracking-widest">
              {catLabel ? catLabel.toUpperCase() : marcaLabel ? marcaLabel.toUpperCase() : soPromo ? 'PROMOÇÕES' : 'CATÁLOGO'}
            </h1>
            <p className="font-body text-muted-foreground text-sm mt-1">
              {loading ? 'Carregando...' : `${produtos.length} produto(s) encontrado(s)`}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Search + filter bar */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar produtos..."
                className="form-input pl-10 h-11"
              />
            </div>
            <button onClick={() => setShowFilter(!showFilter)}
              className={cn('flex items-center gap-2 px-4 h-11 rounded-xl border font-body text-sm font-semibold transition-all',
                showFilter ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/30 text-[var(--brand-primary)]' : 'bg-card border-border text-foreground hover:border-[var(--brand-primary)]/30')}>
              <SlidersHorizontal size={15} />
              <span className="hidden sm:inline">Filtros</span>
              {hasFilter && <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)]" />}
            </button>
          </div>

          {/* Filter panel */}
          {showFilter && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-4 mb-4 space-y-4">
              {/* Categories */}
              <div>
                <p className="form-label">Categoria</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setCatSlug('')}
                    className={cn('px-3 py-1.5 rounded-full text-xs font-body font-semibold border transition-all',
                      !catSlug ? 'bg-[var(--brand-primary)] text-black border-transparent' : 'bg-muted border-border text-muted-foreground hover:border-[var(--brand-primary)]/30')}>
                    Todas
                  </button>
                  {categorias.map(c => (
                    <button key={c.id} onClick={() => setCatSlug(catSlug === c.slug ? '' : c.slug)}
                      className={cn('px-3 py-1.5 rounded-full text-xs font-body font-semibold border transition-all',
                        catSlug === c.slug ? 'bg-[var(--brand-primary)] text-black border-transparent' : 'bg-muted border-border text-muted-foreground hover:border-[var(--brand-primary)]/30')}>
                      {c.icone} {c.nome}
                    </button>
                  ))}
                </div>
              </div>
              {/* Brands */}
              {marcas.length > 0 && (
                <div>
                  <p className="form-label">Marca</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setMarcaSlug('')}
                      className={cn('px-3 py-1.5 rounded-full text-xs font-body font-semibold border transition-all',
                        !marcaSlug ? 'bg-[var(--brand-primary)] text-black border-transparent' : 'bg-muted border-border text-muted-foreground')}>
                      Todas
                    </button>
                    {marcas.map(m => (
                      <button key={m.id} onClick={() => setMarcaSlug(marcaSlug === m.slug ? '' : m.slug)}
                        className={cn('px-3 py-1.5 rounded-full text-xs font-body font-semibold border transition-all',
                          marcaSlug === m.slug ? 'bg-[var(--brand-primary)] text-black border-transparent' : 'bg-muted border-border text-muted-foreground')}>
                        {m.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Toggles */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '🔥 Promoções', active: soPromo,    toggle: () => setSoPromo(!soPromo) },
                  { label: '⭐ Destaques', active: soDestaque, toggle: () => setSoDestaque(!soDestaque) },
                ].map(t => (
                  <button key={t.label} onClick={t.toggle}
                    className={cn('px-3 py-1.5 rounded-full text-xs font-body font-semibold border transition-all',
                      t.active ? 'bg-[var(--brand-primary)] text-black border-transparent' : 'bg-muted border-border text-muted-foreground')}>
                    {t.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Active filter chips */}
          {hasFilter && (
            <div className="flex flex-wrap gap-2 mb-4">
              {catLabel && <Chip label={catLabel} onRemove={() => setCatSlug('')} />}
              {marcaLabel && <Chip label={marcaLabel} onRemove={() => setMarcaSlug('')} />}
              {busca && <Chip label={`"${busca}"`} onRemove={() => setBusca('')} />}
              {soPromo && <Chip label="Promoção" onRemove={() => setSoPromo(false)} />}
              {soDestaque && <Chip label="Destaque" onRemove={() => setSoDestaque(false)} />}
              <button onClick={clearAll} className="text-muted-foreground hover:text-red-400 font-body text-xs transition-colors">Limpar tudo</button>
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <ProductSkeleton count={8} />
          ) : produtos.length === 0 ? (
            <div className="py-20 text-center">
              <Filter size={40} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-body text-muted-foreground text-lg">Nenhum produto encontrado.</p>
              <button onClick={clearAll} className="mt-3 text-[var(--brand-primary)] font-body text-sm hover:underline">Limpar filtros</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {produtos.map((p, i) => <ProductCard key={p.id} produto={p} index={i} />)}
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
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 text-[var(--brand-primary)] rounded-full font-body text-xs font-semibold">
      {label}
      <button onClick={onRemove} className="hover:text-red-400 transition-colors"><X size={11} /></button>
    </span>
  )
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" /></div>}>
      <CatalogContent />
    </Suspense>
  )
}
