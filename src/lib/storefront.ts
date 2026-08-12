import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'

function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export const getBrandColors = unstable_cache(
  async () => {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('configuracoes')
      .select('chave,valor')
      .in('chave', ['cor_primaria', 'cor_secundaria', 'cor_botao'])

    return (data || []).reduce<Record<string, string>>((colors, item) => {
      if (item.valor) colors[item.chave] = item.valor
      return colors
    }, {})
  },
  ['megafort-brand-colors'],
  { revalidate: 120 }
)

export const getHomeData = unstable_cache(
  async () => {
    const supabase = createPublicClient()
    const [bannersResult, categoriasResult, destaquesResult, promocoesResult, marcasResult] = await Promise.all([
      supabase.from('banners').select('*').eq('ativo', true).order('ordem').limit(5),
      supabase.from('categorias').select('*').eq('ativa', true).order('ordem').limit(8),
      supabase
        .from('produtos')
        .select('*, categoria:categorias(nome,slug), marca:marcas(nome), imagens:product_images(url,is_principal,ordem)')
        .eq('ativo', true)
        .eq('em_destaque', true)
        .order('criado_em', { ascending: false })
        .limit(8),
      supabase
        .from('produtos')
        .select('*, categoria:categorias(nome,slug), marca:marcas(nome), imagens:product_images(url,is_principal,ordem)')
        .eq('ativo', true)
        .eq('em_promocao', true)
        .order('criado_em', { ascending: false })
        .limit(8),
      supabase.from('marcas').select('*').eq('ativa', true).order('nome').limit(8),
    ])

    return {
      banners: bannersResult.data || [],
      categorias: categoriasResult.data || [],
      destaques: destaquesResult.data || [],
      promocoes: promocoesResult.data || [],
      marcas: marcasResult.data || [],
    }
  },
  ['megafort-home-data'],
  { revalidate: 120 }
)
