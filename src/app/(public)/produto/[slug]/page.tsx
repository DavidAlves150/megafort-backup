'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ZoomIn, Share2, Eye, ArrowLeft, Play, ShoppingBag } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'
import { StockBadge } from '@/components/products/StockBadge'
import { ProductCard } from '@/components/products/ProductCard'
import { createClient } from '@/lib/supabase/client'
import { Produto, getEstoqueStatus } from '@/types'
import { formatCurrency, getPrecoAtual, isNovidade, cn } from '@/lib/utils'
import { trackAndOpenWhatsApp } from '@/lib/utils/whatsapp'

export default function ProdutoPage() {
  const { slug }  = useParams<{ slug: string }>()
  const [produto, setProduto]   = useState<Produto | null>(null)
  const [related, setRelated]   = useState<Produto[]>([])
  const [loading, setLoading]   = useState(true)
  const [imgIdx,  setImgIdx]    = useState(0)
  const [zoom,    setZoom]      = useState(false)
  const [playVid, setPlayVid]   = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (slug) load()
  }, [slug])

  async function load() {
    const { data } = await supabase
      .from('produtos')
      .select('*, categoria:categorias(*), marca:marcas(*), imagens:product_images(url,ordem,is_principal), videos:product_videos(url,thumbnail_url,tipo,ordem)')
      .eq('slug', slug).eq('ativo', true).single()

    if (data) {
      setProduto(data as unknown as Produto)
      // Track view
      fetch('/api/track-click', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto_id: data.id, tipo: 'view' }) }).catch(() => {})
      // Load related
      if (data.categoria_id) {
        const { data: rel } = await supabase
          .from('produtos')
          .select('*, categoria:categorias(nome,slug), marca:marcas(nome), imagens:product_images(url,is_principal,ordem)')
          .eq('ativo', true).eq('categoria_id', data.categoria_id)
          .neq('id', data.id).limit(4)
        setRelated((rel || []) as unknown as Produto[])
      }
    }
    setLoading(false)
  }

  if (loading) return (
    <>
      <Header />
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    </>
  )

  if (!produto) return (
    <>
      <Header />
      <div className="min-h-screen pt-16 flex flex-col items-center justify-center gap-4 px-4">
        <ShoppingBag size={48} className="text-muted-foreground/30" />
        <p className="font-body text-muted-foreground text-lg">Produto não encontrado.</p>
        <Link href="/catalogo" className="flex items-center gap-2 text-[var(--brand-primary)] font-body hover:underline">
          <ArrowLeft size={16} /> Voltar ao catálogo
        </Link>
      </div>
    </>
  )

  const imgs    = produto.imagens?.sort((a: any, b: any) => a.ordem - b.ordem) || []
  const vids    = produto.videos?.sort((a: any, b: any) => a.ordem - b.ordem) || []
  const preco   = getPrecoAtual(produto)
  const status  = getEstoqueStatus(produto.estoque)
  const novidade= isNovidade(produto.criado_em)
  const temDesc = produto.em_promocao && produto.preco_promocional && produto.preco_promocional < produto.preco_venda
  const cat     = (produto as any).categoria
  const marca   = (produto as any).marca

  return (
    <>
      <Header />
      <main className="min-h-screen pt-16">
        {/* Breadcrumb */}
        <div className="px-4 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-1.5 font-body text-muted-foreground text-xs flex-wrap">
            <Link href="/" className="hover:text-[var(--brand-primary)] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/catalogo" className="hover:text-[var(--brand-primary)] transition-colors">Catálogo</Link>
            {cat && <><span>/</span><Link href={`/catalogo?categoria=${cat.slug}`} className="hover:text-[var(--brand-primary)] transition-colors">{cat.nome}</Link></>}
            <span>/</span>
            <span className="text-foreground truncate max-w-[160px]">{produto.nome}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Gallery */}
            <div className="space-y-2">
              {/* Main media */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-card border border-border cursor-zoom-in"
                onClick={() => !playVid && setZoom(true)}>
                {vids.length > 0 && playVid ? (
                  <video src={vids[0].url} controls autoPlay className="w-full h-full object-cover" />
                ) : imgs.length > 0 ? (
                  <AnimatePresence mode="wait">
                    <motion.div key={imgIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }} className="absolute inset-0">
                      <Image src={imgs[imgIdx]?.url} alt={produto.nome} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag size={60} className="text-muted-foreground/20" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {novidade && <span className="px-2.5 py-1 bg-[var(--brand-primary)] text-black font-display text-xs rounded-full">NOVO</span>}
                  {produto.em_promocao && <span className="px-2.5 py-1 bg-red-500 text-white font-display text-xs rounded-full">PROMO</span>}
                  {produto.em_destaque && <span className="px-2.5 py-1 bg-yellow-500 text-black font-display text-xs rounded-full">TOP</span>}
                </div>

                {/* Nav arrows */}
                {imgs.length > 1 && !playVid && (
                  <>
                    <button onClick={e => { e.stopPropagation(); setImgIdx(i => (i-1+imgs.length)%imgs.length) }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all">
                      <ChevronLeft size={18} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setImgIdx(i => (i+1)%imgs.length) }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all">
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
                {!playVid && <div className="absolute bottom-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"><ZoomIn size={14} /></div>}

                {/* Dot nav */}
                {imgs.length > 1 && !playVid && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                    {imgs.map((_: any, i: number) => (
                      <button key={i} onClick={e => { e.stopPropagation(); setImgIdx(i) }}
                        className={cn('h-1.5 rounded-full transition-all', i === imgIdx ? 'bg-[var(--brand-primary)] w-4' : 'bg-white/40 w-1.5')} />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                {imgs.map((img: any, i: number) => (
                  <button key={i} onClick={() => { setImgIdx(i); setPlayVid(false) }}
                    className={cn('flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all',
                      i === imgIdx && !playVid ? 'border-[var(--brand-primary)]' : 'border-border hover:border-border/50')}>
                    <Image src={img.url} alt="" width={56} height={56} className="object-cover w-full h-full" />
                  </button>
                ))}
                {vids.map((vid: any, i: number) => (
                  <button key={`v${i}`} onClick={() => setPlayVid(true)}
                    className={cn('flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 bg-black transition-all relative',
                      playVid ? 'border-[var(--brand-primary)]' : 'border-border')}>
                    <Play size={18} className="absolute inset-0 m-auto text-white" />
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
              className="space-y-5">
              {/* Brand + Category */}
              <div className="flex items-center gap-2 flex-wrap">
                {marca && <Link href={`/catalogo?marca=${(produto as any).marca?.slug || ''}`}
                  className="font-body text-[var(--brand-primary)] text-xs font-semibold tracking-widest uppercase hover:underline">{marca.nome}</Link>}
                {marca && cat && <span className="text-muted-foreground text-xs">·</span>}
                {cat && <Link href={`/catalogo?categoria=${cat.slug}`}
                  className="font-body text-muted-foreground text-xs uppercase tracking-wider hover:text-foreground transition-colors">{cat.nome}</Link>}
              </div>

              <h1 className="font-display text-foreground text-3xl md:text-4xl tracking-widest leading-tight">{produto.nome}</h1>
              {produto.sku && <p className="font-mono text-muted-foreground text-xs">SKU: {produto.sku}</p>}

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className={cn('font-display text-4xl md:text-5xl leading-none', produto.em_promocao ? 'text-red-500' : 'text-[var(--brand-primary)]')}>
                  {formatCurrency(preco)}
                </span>
                {temDesc && <span className="text-muted-foreground text-xl line-through font-body">{formatCurrency(produto.preco_venda)}</span>}
              </div>

              {/* Stock */}
              <StockBadge estoque={produto.estoque} showCount />

              {/* Description */}
              {(produto.descricao_curta || produto.descricao) && (
                <p className="font-body text-muted-foreground text-sm leading-relaxed">
                  {produto.descricao_curta || produto.descricao}
                </p>
              )}

              {/* CTA */}
              <div className="space-y-3 pt-2">
                <button onClick={() => trackAndOpenWhatsApp(produto)} disabled={status === 'esgotado'}
                  className={cn('w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-display text-xl tracking-widest transition-all',
                    status === 'esgotado'
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-[#25D366] text-white hover:bg-[#20b858] hover:-translate-y-0.5 shadow-[0_4px_30px_rgba(37,211,102,0.4)]')}>
                  {status !== 'esgotado' && <WaIcon />}
                  {status === 'esgotado' ? 'PRODUTO ESGOTADO' : 'COMPRAR PELO WHATSAPP'}
                </button>

                <button onClick={() => navigator.share?.({ title: produto.nome, url: window.location.href })
                    .catch(() => navigator.clipboard?.writeText(window.location.href))}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-card border border-border rounded-2xl text-muted-foreground hover:text-foreground hover:border-[var(--brand-primary)]/30 font-body text-sm tracking-wider transition-all">
                  <Share2 size={15} /> Compartilhar
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-muted-foreground font-body text-xs">
                <Eye size={12} /> {produto.visualizacoes} visualizações
              </div>
            </motion.div>
          </div>

          {/* Full description */}
          {produto.descricao && produto.descricao !== produto.descricao_curta && (
            <div className="mt-12 bg-card border border-border rounded-2xl p-6">
              <h2 className="font-display text-foreground text-2xl tracking-widest mb-4">DESCRIÇÃO</h2>
              <div className="font-body text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{produto.descricao}</div>
            </div>
          )}

          {/* Related */}
          {related.length > 0 && (
            <div className="mt-12">
              <h2 className="font-display text-foreground text-2xl md:text-3xl tracking-widest mb-6">PRODUTOS RELACIONADOS</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {related.map((p, i) => <ProductCard key={p.id} produto={p} index={i} />)}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Zoom modal */}
      <AnimatePresence>
        {zoom && imgs.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setZoom(false)}>
            <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white text-xl">✕</button>
            <img src={imgs[imgIdx]?.url} alt={produto.nome}
              className="max-w-full max-h-full object-contain rounded-xl" onClick={e => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
      <WhatsAppButton />
    </>
  )
}

function WaIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
}
