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
  const { data } = await supabase.from('categorias').select('nome,descricao').eq('slug', slug).single()
  return { title: data ? `${data.nome} | MegaFort Suplementos` : 'Categoria | MegaFort' }
}

export default async function CategoriaPage({ params }: Props) {
  const { slug } = await params
  const supabase  = await createClient()

  const { data: cat } = await supabase.from('categorias').select('*').eq('slug', slug).eq('ativa', true).single()
  if (!cat) notFound()

  const { data: produtos } = await supabase.from('produtos')
    .select('*, categoria:categorias(nome,slug), marca:marcas(nome), imagens:product_images(url,is_principal,ordem)')
    .eq('ativo', true).eq('categoria_id', cat.id)
    .order('criado_em', { ascending: false }).limit(60)

  return (
    <>
      <Header />
      <main className="min-h-screen pt-16">
        <div className="bg-surface-2 border-b border-border px-4 py-10 text-center">
          <span className="text-4xl block mb-2">{cat.icone}</span>
          <h1 className="font-display text-foreground text-4xl md:text-5xl tracking-widest">{cat.nome.toUpperCase()}</h1>
          {cat.descricao && <p className="font-body text-muted-foreground text-sm mt-2 max-w-md mx-auto">{cat.descricao}</p>}
          <p className="font-body text-muted-foreground text-xs mt-2">{(produtos||[]).length} produto(s)</p>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {(!produtos || produtos.length === 0) ? (
            <div className="py-20 text-center"><p className="font-body text-muted-foreground text-lg">Nenhum produto nesta categoria.</p></div>
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
