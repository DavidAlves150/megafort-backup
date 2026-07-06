import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'
import { ProductCard } from '@/components/products/ProductCard'
import { createClient } from '@/lib/supabase/server'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('marcas').select('nome').eq('slug', slug).single()
  return { title: data ? `${data.nome} | MegaFort Suplementos` : 'Marca | MegaFort' }
}

export default async function MarcaPage({ params }: Props) {
  const { slug } = await params
  const supabase  = await createClient()

  const { data: marca } = await supabase.from('marcas').select('*').eq('slug', slug).eq('ativa', true).single()
  if (!marca) notFound()

  const { data: produtos } = await supabase.from('produtos')
    .select('*, categoria:categorias(nome,slug), marca:marcas(nome), imagens:product_images(url,is_principal,ordem)')
    .eq('ativo', true).eq('marca_id', marca.id)
    .order('criado_em', { ascending: false }).limit(60)

  return (
    <>
      <Header />
      <main className="min-h-screen pt-16">
        <div className="bg-surface-2 border-b border-border px-4 py-10 text-center">
          {marca.logo_url && <img src={marca.logo_url} alt={marca.nome} className="h-16 object-contain mx-auto mb-3"/>}
          <h1 className="font-display text-foreground text-4xl md:text-5xl tracking-widest">{marca.nome.toUpperCase()}</h1>
          {marca.descricao && <p className="font-body text-muted-foreground text-sm mt-2 max-w-md mx-auto">{marca.descricao}</p>}
          <p className="font-body text-muted-foreground text-xs mt-2">{(produtos||[]).length} produto(s)</p>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {(!produtos || produtos.length === 0) ? (
            <div className="py-20 text-center"><p className="font-body text-muted-foreground text-lg">Nenhum produto desta marca.</p></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {(produtos as any[]).map((p, i) => <ProductCard key={p.id} produto={p} index={i} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
