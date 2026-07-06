'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sun, Moon, Search, Instagram } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/',          label: 'Home' },
  { href: '/catalogo',  label: 'Catálogo' },
  { href: '/promocoes', label: 'Promoções' },
  { href: '/sobre',     label: 'Sobre' },
  { href: '/contato',   label: 'Contato' },
]

export function Header() {
  const [scrolled, setScrolled]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, setTheme }         = useTheme()
  const [mounted, setMounted]       = useState(false)
  const pathname                    = usePathname()

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  useEffect(() => { setMobileOpen(false) }, [pathname])

  return (
    <>
      <motion.header
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          'fixed top-0 inset-x-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-background/95 backdrop-blur-xl border-b border-border shadow-sm'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center flex-shrink-0">
              <span className="font-display text-black text-sm leading-none">MF</span>
            </div>
            <div className="hidden xs:block min-w-0">
              <div className="font-display text-foreground text-base tracking-widest leading-none truncate">MEGAFORT</div>
              <div className="font-body text-[var(--brand-primary)] text-[9px] tracking-[0.3em] uppercase leading-none mt-0.5">Suplementos</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative px-4 py-2 font-body font-semibold text-sm tracking-widest uppercase transition-all duration-200',
                  pathname === link.href ? 'text-[var(--brand-primary)]' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {pathname === link.href && (
                  <motion.span layoutId="activeTab" className="absolute inset-0 bg-[var(--brand-primary)]/10 rounded-lg border border-[var(--brand-primary)]/20" />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Link href="/catalogo?busca=" aria-label="Buscar"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <Search size={16} />
            </Link>

            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Alternar tema"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}

            <Link href="https://www.instagram.com/megafort_suplementos" target="_blank" rel="noopener"
              className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <Instagram size={16} />
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full bg-muted text-muted-foreground"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)} />

            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-background border-l border-border flex flex-col lg:hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div>
                  <div className="font-display text-foreground text-xl tracking-widest">MEGAFORT</div>
                  <div className="font-body text-[var(--brand-primary)] text-xs tracking-[0.3em] uppercase">Suplementos</div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-1">
                {NAV.map((link, i) => (
                  <motion.div key={link.href} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <Link href={link.href}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3.5 rounded-xl font-body font-semibold text-base tracking-wider uppercase transition-all',
                        pathname === link.href
                          ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/20'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <span className="text-[var(--brand-primary)]/40 font-mono text-xs w-5">{String(i + 1).padStart(2, '0')}</span>
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="p-4 border-t border-border space-y-2">
                <Link href="https://wa.me/5598885916645" target="_blank"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 font-body font-semibold text-sm">
                  <WaIcon /> WhatsApp
                </Link>
                <Link href="https://www.instagram.com/megafort_suplementos" target="_blank"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 font-body font-semibold text-sm">
                  <Instagram size={16} /> Instagram
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function WaIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
}
