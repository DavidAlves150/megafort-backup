import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'
import { ProductCard } from '@/components/products/ProductCard'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Promoções | MegaFort Suplementos' }

export default async function PromocoesPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('produtos')
    .select('*, categoria:categorias(nome,slug), marca:marcas(nome), imagens:product_images(url,is_principal,ordem)')
    .eq('ativo', true).eq('em_promocao', true)
    .order('criado_em', { ascending: false }).limit(60)
  const produtos = (data || []) as any[]

  return (
    <>
      <Header />
      <main className="min-h-screen pt-16">
        <div className="bg-gradient-to-br from-red-500/10 via-transparent to-orange-500/10 border-b border-border px-4 py-10 text-center">
          <span className="font-body text-red-400 text-xs tracking-[0.4em] uppercase">Ofertas imperdíveis</span>
          <h1 className="font-display text-foreground text-4xl md:text-6xl tracking-widest mt-1">PROMOÇÕES</h1>
          <p className="font-body text-muted-foreground text-sm mt-2">{produtos.length} produto(s) em promoção</p>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {produtos.length === 0 ? (
            <div className="py-20 text-center"><p className="font-body text-muted-foreground text-lg">Nenhuma promoção no momento.</p></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {produtos.map((p: any, i: number) => <ProductCard key={p.id} produto={p} index={i} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
