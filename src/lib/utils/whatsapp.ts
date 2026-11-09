import { ProdutoPublico as Produto } from '@/types'
import { getPrecoAtual, formatCurrency } from './index'

const DEFAULT_WA = '5598985916645'

export function getWhatsApp(): string {
  return process.env.NEXT_PUBLIC_WHATSAPP || DEFAULT_WA
}

export interface FotoEscolhida { url: string; numero: number }

export function orderMessage(produto: Produto, foto?: FotoEscolhida): string {
  const preco = formatCurrency(getPrecoAtual(produto))
  const escolha = foto ? `\n\nEscolhi a foto ${foto.numero}: ${foto.url}` : ''
  return `Olá! Tenho interesse no produto *${produto.nome}* que vi no catálogo da VIBE FITNESS.\n\nPreço: ${preco}${escolha}\n\nGostaria de mais informações.`
}

export function buildWhatsAppLink(produto: Produto, foto?: FotoEscolhida): string {
  return `https://wa.me/${getWhatsApp()}?text=${encodeURIComponent(orderMessage(produto, foto))}`
}

export function buildWhatsAppGeneral(): string {
  return `https://wa.me/${getWhatsApp()}`
}

/** Registra o clique e abre WhatsApp */
export function trackAndOpenWhatsApp(produto: Produto, foto?: FotoEscolhida): void {
  // Track assíncrono — não bloqueia a abertura
  fetch('/api/track-click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ produto_id: produto.id, tipo: 'whatsapp' }),
  }).catch(() => {})

  window.open(buildWhatsAppLink(produto, foto), '_blank', 'noopener,noreferrer')
}
