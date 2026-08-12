import { Header } from '@/components/layout/Header'

import { PageTransition } from "@/components/ui/PageTransition";
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'
import { HeroSection } from '@/components/home/HeroSection'
import { CategoriesSection } from '@/components/home/CategoriesSection'
import { FeaturedSection } from '@/components/home/FeaturedSection'
import { PromoBanner } from '@/components/home/PromoBanner'
import { BrandsSection } from '@/components/home/BrandsSection'
import { WhatsAppCTA } from '@/components/home/WhatsAppCTA'
import { getHomeData } from '@/lib/storefront'

export default async function HomePage() {
  const { banners, categorias, destaques, promocoes, marcas } = await getHomeData()

  return (
    <>
      <PageTransition>

        <Header />
        <main className="min-h-screen">
          <HeroSection banners={banners} />
          <CategoriesSection categorias={categorias} />
          <FeaturedSection produtos={destaques} />
          {promocoes.length > 0 && <PromoBanner produtos={promocoes} />}
          {marcas.length > 0 && <BrandsSection marcas={marcas} />}
          <WhatsAppCTA />
        </main>
        <Footer />
        <WhatsAppButton />
      </PageTransition>
    </>
  )
}
