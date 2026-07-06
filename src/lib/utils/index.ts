import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { getEstoqueStatus, ESTOQUE_LABELS, ESTOQUE_COLORS } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date))
}

export function calcLucro(precoCompra: number, precoVenda: number) {
  const lucroUnitario = precoVenda - precoCompra
  const margemPercent = precoVenda > 0 ? (lucroUnitario / precoVenda) * 100 : 0
  return { lucroUnitario, margemPercent }
}

export function calcLucroPotencial(precoCompra: number, precoVenda: number, estoque: number) {
  const { lucroUnitario, margemPercent } = calcLucro(precoCompra, precoVenda)
  return { lucroUnitario, lucroTotal: lucroUnitario * estoque, margemPercent }
}

export function calcValorEstoque(precoCompra: number, estoque: number) {
  return precoCompra * estoque
}

export function getPrecoAtual(produto: { preco_venda: number; preco_promocional: number | null; em_promocao: boolean }) {
  return produto.em_promocao && produto.preco_promocional ? produto.preco_promocional : produto.preco_venda
}

export { getEstoqueStatus, ESTOQUE_LABELS, ESTOQUE_COLORS }

export function isNovidade(criadoEm: string, diasParaNovidade = 15): boolean {
  const criado = new Date(criadoEm)
  const agora = new Date()
  const diff = (agora.getTime() - criado.getTime()) / (1000 * 60 * 60 * 24)
  return diff <= diasParaNovidade
}

export function truncate(str: string, length: number): string {
  return str.length <= length ? str : str.slice(0, length) + '...'
}
