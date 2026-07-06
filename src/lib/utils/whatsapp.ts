import { Produto } from '@/types'
import { getPrecoAtual, formatCurrency } from './index'

const DEFAULT_WA = '5598885916645'

export function getWhatsApp(): string {
  return process.env.NEXT_PUBLIC_WHATSAPP || DEFAULT_WA
}

export function buildWhatsAppLink(produto: Produto): string {
  const preco = formatCurrency(getPrecoAtual(produto))
  const msg = `Olá! Tenho interesse no produto *${produto.nome}* que vi no catálogo da MegaFort Suplementos.\n\nPreço: ${preco}\n\nGostaria de mais informações.`
  return `https://wa.me/${getWhatsApp()}?text=${encodeURIComponent(msg)}`
}

export function buildWhatsAppGeneral(): string {
  return `https://wa.me/${getWhatsApp()}`
}

/** Registra o clique e abre WhatsApp */
export async function trackAndOpenWhatsApp(produto: Produto): Promise<void> {
  // Track assíncrono — não bloqueia a abertura
  fetch('/api/track-click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ produto_id: produto.id, tipo: 'whatsapp' }),
  }).catch(() => {})

  window.open(buildWhatsAppLink(produto), '_blank', 'noopener,noreferrer')
}
