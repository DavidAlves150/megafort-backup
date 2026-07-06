import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'
import { HeroSection } from '@/components/home/HeroSection'
import { CategoriesSection } from '@/components/home/CategoriesSection'
import { FeaturedSection } from '@/components/home/FeaturedSection'
import { PromoBanner } from '@/components/home/PromoBanner'
import { BrandsSection } from '@/components/home/BrandsSection'
import { WhatsAppCTA } from '@/components/home/WhatsAppCTA'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()

  const [
    { data: banners },
    { data: categorias },
    { data: destaques },
    { data: promocoes },
    { data: marcas },
  ] = await Promise.all([
    supabase.from('banners').select('*').eq('ativo', true).order('ordem').limit(5),
    supabase.from('categorias').select('*').eq('ativa', true).order('ordem').limit(8),
    supabase.from('produtos')
      .select('*, categoria:categorias(nome,slug), marca:marcas(nome), imagens:product_images(url,is_principal,ordem)')
      .eq('ativo', true).eq('em_destaque', true).order('criado_em', { ascending: false }).limit(8),
    supabase.from('produtos')
      .select('*, categoria:categorias(nome,slug), marca:marcas(nome), imagens:product_images(url,is_principal,ordem)')
      .eq('ativo', true).eq('em_promocao', true).order('criado_em', { ascending: false }).limit(8),
    supabase.from('marcas').select('*').eq('ativa', true).order('nome').limit(8),
  ])

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <HeroSection banners={banners || []} />
        <CategoriesSection categorias={categorias || []} />
        <FeaturedSection produtos={destaques || []} />
        {(promocoes?.length ?? 0) > 0 && <PromoBanner produtos={promocoes || []} />}
        {(marcas?.length ?? 0) > 0 && <BrandsSection marcas={marcas || []} />}
        <WhatsAppCTA />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
