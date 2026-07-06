'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Banner {
  id: string
  image_url: string
  link_url?: string
  titulo?: string
  subtitulo?: string
}

export function HeroSection({ banners }: { banners: Banner[] }) {
  return (
    <section className="relative h-[500px] md:h-[600px] w-full overflow-hidden bg-black">
      {banners.length > 0 ? (
        <div className="absolute inset-0">
          {banners.map((banner, index) => (
            <div key={banner.id} className="relative h-full w-full">
              <img 
                src={banner.image_url} 
                alt={banner.titulo || 'Banner'} 
                className="h-full w-full object-cover opacity-60"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-6xl font-display text-white tracking-widest mb-4"
                >
                  {banner.titulo || 'MEGAFORT'}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg md:text-xl text-white/80 font-body max-w-2xl mb-8"
                >
                  {banner.subtitulo || 'Sua melhor escolha em suplementação'}
                </motion.p>
                {banner.link_url && (
                  <Link 
                    href={banner.link_url}
                    className="inline-flex items-center gap-2 bg-[#CCFF00] text-black px-8 py-4 rounded-xl font-display text-sm tracking-widest hover:opacity-90 transition-all"
                  >
                    CONFIRA AGORA <ArrowRight size={18} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <h1 className="text-4xl md:text-6xl font-display text-white tracking-widest mb-4">MEGAFORT</h1>
          <p className="text-lg md:text-xl text-white/80 font-body max-w-2xl mb-8">
            Sua melhor escolha em suplementação
          </p>
          <Link 
            href="/catalogo"
            className="inline-flex items-center gap-2 bg-[#CCFF00] text-black px-8 py-4 rounded-xl font-display text-sm tracking-widest hover:opacity-90 transition-all"
          >
            VER CATÁLOGO <ArrowRight size={18} />
          </Link>
        </div>
      )}
    </section>
  )
}
