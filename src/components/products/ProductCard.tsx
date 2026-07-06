'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Heart, ShoppingBag, Play } from 'lucide-react'
import { Produto } from '@/types'
import { cn, formatCurrency, getPrecoAtual, getEstoqueStatus, isNovidade } from '@/lib/utils'
import { trackAndOpenWhatsApp } from '@/lib/utils/whatsapp'
import { StockBadge } from './StockBadge'

interface ProductCardProps {
  produto: Produto
  index?: number
}

export function ProductCard({ produto, index = 0 }: ProductCardProps) {
  const [liked, setLiked] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)

  const imagens = produto.imagens?.filter(i => i.url) || []
  const hasVideo = (produto.videos?.length ?? 0) > 0
  const mainImg = imagens[0]?.url || null
  const hoverImg = imagens[1]?.url || null
  const status = getEstoqueStatus(produto.estoque)
  const preco = getPrecoAtual(produto)
  const temDesconto = produto.em_promocao && produto.preco_promocional && produto.preco_promocional < produto.preco_venda
  const novidade = isNovidade(produto.criado_em)

  const handleBuy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (status !== 'esgotado') trackAndOpenWhatsApp(produto)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.3) }}
      className="product-card group"
    >
      {/* Image area */}
      <Link href={`/produto/${produto.slug}`} className="block">
        <div
          className="relative aspect-square bg-muted overflow-hidden"
          onMouseEnter={() => hoverImg && setImgIdx(1)}
          onMouseLeave={() => setImgIdx(0)}
        >
          {mainImg ? (
            <>
              <Image
                src={imagens[imgIdx]?.url || mainImg}
                alt={produto.nome}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading="lazy"
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag size={36} className="text-muted-foreground/30" />
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Badges top-left */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {novidade && (
              <span className="px-2 py-0.5 bg-[var(--brand-primary)] text-black text-[10px] font-display rounded-full leading-none">
                NOVO
              </span>
            )}
            {produto.em_promocao && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-display rounded-full leading-none">
                PROMO
              </span>
            )}
            {produto.em_destaque && (
              <span className="px-2 py-0.5 bg-yellow-500 text-black text-[10px] font-display rounded-full leading-none">
                TOP
              </span>
            )}
          </div>

          {/* Video indicator */}
          {hasVideo && (
            <div className="absolute top-2 right-10 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center">
              <Play size={10} className="text-white fill-white ml-0.5" />
            </div>
          )}

          {/* Like button */}
          <button
            onClick={e => { e.preventDefault(); setLiked(!liked) }}
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-white/10 transition-all"
            aria-label="Favoritar"
          >
            <Heart size={12} className={cn(liked ? 'fill-red-500 text-red-500' : 'text-white/80')} />
          </button>

          {/* Image dots */}
          {imagens.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {imagens.slice(0, 4).map((_, i) => (
                <span key={i} className={cn('h-1 rounded-full transition-all', i === imgIdx ? 'bg-[var(--brand-primary)] w-3' : 'bg-white/40 w-1')} />
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-3">
        {/* Brand + Category */}
        <div className="flex items-center gap-1.5 mb-1">
          {(produto as any).marca?.nome && (
            <span className="text-[10px] font-body font-semibold text-[var(--brand-primary)] uppercase tracking-wider">
              {(produto as any).marca.nome}
            </span>
          )}
          {(produto as any).categoria?.nome && (produto as any).marca?.nome && (
            <span className="text-muted-foreground text-[10px]">·</span>
          )}
          {(produto as any).categoria?.nome && (
            <span className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">
              {(produto as any).categoria.nome}
            </span>
          )}
        </div>

        {/* Name */}
        <Link href={`/produto/${produto.slug}`}>
          <h3 className="font-body font-semibold text-foreground text-sm leading-tight hover:text-[var(--brand-primary)] transition-colors line-clamp-2">
            {produto.nome}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mt-2">
          <span className={cn('font-display text-xl leading-none', produto.em_promocao ? 'text-red-500' : 'text-[var(--brand-primary)]')}>
            {formatCurrency(preco)}
          </span>
          {temDesconto && (
            <span className="text-muted-foreground text-xs line-through font-body">
              {formatCurrency(produto.preco_venda)}
            </span>
          )}
        </div>

        {/* Stock badge */}
        <div className="mt-2">
          <StockBadge estoque={produto.estoque} size="sm" />
        </div>

        {/* Buy button */}
        <button
          onClick={handleBuy}
          disabled={status === 'esgotado'}
          className={cn(
            'mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-display text-sm tracking-widest transition-all duration-300',
            status === 'esgotado'
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-[var(--brand-button)] text-black hover:opacity-90 hover:shadow-neon-sm active:scale-95'
          )}
        >
          {status === 'esgotado' ? 'ESGOTADO' : (
            <>
              <WhatsAppIcon size={14} />
              COMPRAR
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}
