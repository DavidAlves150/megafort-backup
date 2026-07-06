// =====================================================
// MegaFort Suplementos v2 — Global Types
// =====================================================

export interface Categoria {
  id: string
  nome: string
  slug: string
  descricao: string | null
  icone: string
  imagem_url: string | null
  cor: string
  ordem: number
  ativa: boolean
  criado_em: string
  atualizado_em: string
}

export interface Marca {
  id: string
  nome: string
  slug: string
  descricao: string | null
  logo_url: string | null
  site_url: string | null
  ativa: boolean
  criado_em: string
  atualizado_em: string
}

export interface ProductImage {
  id: string
  produto_id: string
  url: string
  ordem: number
  is_principal: boolean
  criado_em: string
}

export interface ProductVideo {
  id: string
  produto_id: string
  url: string
  thumbnail_url: string | null
  tipo: 'mp4' | 'webm' | 'mov'
  ordem: number
  criado_em: string
}

export interface Produto {
  id: string
  nome: string
  slug: string
  descricao: string | null
  descricao_curta: string | null
  preco_compra: number
  preco_venda: number
  preco_promocional: number | null
  estoque: number
  sku: string | null
  categoria_id: string | null
  marca_id: string | null
  categoria?: Categoria
  marca?: Marca
  imagens?: ProductImage[]
  videos?: ProductVideo[]
  em_destaque: boolean
  em_promocao: boolean
  ativo: boolean
  visualizacoes: number
  criado_em: string
  atualizado_em: string
}

export interface ProdutoComMidia extends Produto {
  imagens: ProductImage[]
  videos: ProductVideo[]
}

export interface Banner {
  id: string
  titulo: string | null
  subtitulo: string | null
  imagem_url: string
  imagem_mobile_url: string | null
  link_url: string | null
  botao_texto: string | null
  ordem: number
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

export interface ClickTracking {
  id: string
  produto_id: string | null
  tipo: 'whatsapp' | 'view'
  ip_hash: string | null
  user_agent: string | null
  criado_em: string
}

export interface Configuracoes {
  nome_empresa: string
  slogan: string
  cidade: string
  whatsapp: string
  instagram: string
  instagram_user: string
  horario_semana: string
  horario_sabado: string
  cor_primaria: string
  cor_secundaria: string
  cor_botao: string
  logo_url: string
  sobre_historia: string
  sobre_missao: string
  sobre_valores: string
  meta_titulo: string
  meta_descricao: string
}

// ── Estoque ──
export type EstoqueStatus = 'disponivel' | 'baixo' | 'urgente' | 'esgotado'

export function getEstoqueStatus(qtd: number): EstoqueStatus {
  if (qtd <= 0) return 'esgotado'
  if (qtd <= 2) return 'urgente'
  if (qtd <= 5) return 'baixo'
  return 'disponivel'
}

export const ESTOQUE_LABELS: Record<EstoqueStatus, string> = {
  disponivel: 'Disponível',
  baixo:      'Estoque Baixo',
  urgente:    'Reposição Urgente',
  esgotado:   'Esgotado',
}

export const ESTOQUE_COLORS: Record<EstoqueStatus, string> = {
  disponivel: 'text-green-400 bg-green-400/10 border-green-400/30',
  baixo:      'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  urgente:    'text-orange-400 bg-orange-400/10 border-orange-400/30',
  esgotado:   'text-red-400 bg-red-400/10 border-red-400/30',
}

// ── Dashboard ──
export interface DashboardStats {
  total_produtos: number
  produtos_ativos: number
  produtos_inativos: number
  produtos_esgotados: number
  produtos_estoque_baixo: number
  produtos_promocao: number
  produtos_destaque: number
  total_categorias: number
  total_marcas: number
  valor_estoque_total: number
  lucro_potencial_total: number
  top_visualizados: Array<{ produto: Produto; visualizacoes: number }>
  top_clicados: Array<{ produto: Produto; cliques: number }>
  clicks_hoje: number
  clicks_semana: number
}

// ── Forms ──
export interface ProdutoFormData {
  nome: string
  descricao: string
  descricao_curta: string
  preco_compra: number
  preco_venda: number
  preco_promocional?: number | null
  estoque: number
  sku: string
  categoria_id?: string | null
  marca_id?: string | null
  em_destaque: boolean
  em_promocao: boolean
  ativo: boolean
}

export interface ProdutoFiltros {
  busca?: string
  categoria_slug?: string
  marca_slug?: string
  em_promocao?: boolean
  em_destaque?: boolean
  estoque_min?: number
  preco_min?: number
  preco_max?: number
  page?: number
  limit?: number
}
