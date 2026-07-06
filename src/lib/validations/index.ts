import { z } from 'zod'

export const produtoSchema = z.object({
  nome:              z.string().min(2, 'Mínimo 2 caracteres').max(200),
  descricao:         z.string().optional().default(''),
  descricao_curta:   z.string().max(500).optional().default(''),
  preco_compra:      z.number({ invalid_type_error: 'Informe um valor' }).min(0, 'Valor inválido'),
  preco_venda:       z.number({ invalid_type_error: 'Informe um valor' }).min(0.01, 'Preço de venda obrigatório'),
  preco_promocional: z.number().nullable().optional(),
  estoque:           z.number({ invalid_type_error: 'Informe a quantidade' }).int().min(0),
  sku:               z.string().optional().default(''),
  categoria_id:      z.string().uuid().nullable().optional(),
  marca_id:          z.string().uuid().nullable().optional(),
  em_destaque:       z.boolean().default(false),
  em_promocao:       z.boolean().default(false),
  ativo:             z.boolean().default(true),
})

export const categoriaSchema = z.object({
  nome:      z.string().min(2, 'Nome obrigatório'),
  slug:      z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug inválido'),
  descricao: z.string().optional().default(''),
  icone:     z.string().optional().default('📦'),
  cor:       z.string().optional().default('#00FF41'),
  ordem:     z.number().int().default(0),
  ativa:     z.boolean().default(true),
})

export const marcaSchema = z.object({
  nome:      z.string().min(2, 'Nome obrigatório'),
  slug:      z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug inválido'),
  descricao: z.string().optional().default(''),
  site_url:  z.string().url('URL inválida').or(z.literal('')).optional().default(''),
  ativa:     z.boolean().default(true),
})

export const bannerSchema = z.object({
  titulo:            z.string().optional().default(''),
  subtitulo:         z.string().optional().default(''),
  imagem_url:        z.string().min(1, 'Imagem obrigatória'),
  imagem_mobile_url: z.string().optional().default(''),
  link_url:          z.string().optional().default(''),
  botao_texto:       z.string().optional().default(''),
  ordem:             z.number().int().default(0),
  ativo:             z.boolean().default(true),
})

export const loginSchema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export type ProdutoSchema   = z.infer<typeof produtoSchema>
export type CategoriaSchema = z.infer<typeof categoriaSchema>
export type MarcaSchema     = z.infer<typeof marcaSchema>
export type BannerSchema    = z.infer<typeof bannerSchema>
export type LoginSchema     = z.infer<typeof loginSchema>
