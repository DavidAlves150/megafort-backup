'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Banner {
  id: string
  imagem_url: string
  link_url?: string
  titulo?: string
  subtitulo?: string
}

export function HeroSection({ banners }: { banners: Banner[] }) {
  const [active, setActive] = useState(0)
  return (
    <section className="relative h-[500px] md:h-[600px] w-full overflow-hidden bg-[#FFF1F5]">
      {banners.length > 0 ? (
        <div className="absolute inset-0">
          {banners.filter((_, index) => index === active % banners.length).map((banner, index) => (
            <div key={banner.id} className="relative h-full w-full">
              <img 
                src={banner.imagem_url}
                alt={banner.titulo || 'Banner'} 
                className="h-full w-full object-cover opacity-20"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pt-20">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-6xl font-display text-[#371c29] tracking-widest mb-4"
                >
                  {banner.titulo || 'VIBE FITNESS'}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg md:text-xl text-[#5c3648] font-body max-w-2xl mb-8"
                >
                  {banner.subtitulo || 'Moda, conforto e energia para acompanhar seu ritmo.'}
                </motion.p>
                {banner.link_url && (
                  <Link 
                    href={banner.link_url}
                    className="inline-flex items-center gap-2 bg-[#FF1493] text-black px-8 py-4 rounded-xl font-display text-sm tracking-widest hover:opacity-90 transition-all"
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
          <h1 className="text-4xl md:text-6xl font-display text-[#371c29] tracking-widest mb-4">VIBE FITNESS</h1>
          <p className="text-lg md:text-xl text-[#5c3648] font-body max-w-2xl mb-8">
            Moda, conforto e energia para acompanhar seu ritmo.
          </p>
          <Link 
            href="/catalogo"
            className="inline-flex items-center gap-2 bg-[#FF1493] text-black px-8 py-4 rounded-xl font-display text-sm tracking-widest hover:opacity-90 transition-all"
          >
            VER CATÁLOGO <ArrowRight size={18} />
          </Link>
        </div>
      )}
      {banners.length > 1 && <div className="absolute bottom-5 inset-x-0 flex justify-center gap-3">
        <button className="rounded-xl bg-white px-4 py-3 text-black" onClick={() => setActive(i => (i - 1 + banners.length) % banners.length)} aria-label="Banner anterior">Anterior</button>
        <span className="self-center text-[#371c29]" aria-live="polite">{active % banners.length + 1} / {banners.length}</span>
        <button className="rounded-xl bg-white px-4 py-3 text-black" onClick={() => setActive(i => (i + 1) % banners.length)} aria-label="Próximo banner">Próximo</button>
      </div>}
    </section>
  )
}
