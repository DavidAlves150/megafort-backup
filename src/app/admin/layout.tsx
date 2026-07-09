'use client'

import React, { ReactNode } from 'react';
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Package, Grid3X3, Award, Image, Settings, Menu, X, LogOut, Plus, ChevronRight, AlertTriangle, BarChart3, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { PageTransition } from '@/components/ui/PageTransition'


const NAV = [
  { href: '/admin/dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/admin/produtos',      label: 'Produtos',     icon: Package },
  { href: '/admin/estoque',       label: 'Estoque',      icon: AlertTriangle },
  { href: '/admin/categorias',    label: 'Categorias',   icon: Grid3X3 },
  { href: '/admin/marcas',        label: 'Marcas',       icon: Award },
  { href: '/admin/banners',       label: 'Banners',      icon: Image },
  { href: '/admin/relatorios',    label: 'Relatórios',   icon: BarChart3 },
  { href: '/admin/financeiro',    label: 'Financeiro',   icon: DollarSign },
  { href: '/admin/configuracoes', label: 'Configurações',icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open,    setOpen]    = useState(false)
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()

  if (pathname === '/admin/login') return <>{children}</>

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const Sidebar = ({ onClick }: { onClick?: () => void }) => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-border">
        <div className="font-display text-foreground text-xl tracking-widest">MEGAFORT</div>
        <div className="font-body text-[var(--brand-primary)] text-[10px] tracking-[0.35em] uppercase mt-0.5">Painel Admin</div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} onClick={onClick}
              className={cn('admin-nav-link', active && 'active')}>
              <item.icon size={17} />
              {item.label}
              {active && <ChevronRight size={13} className="ml-auto text-[var(--brand-primary)]/50" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-1">
        <Link href="/admin/produtos/novo" onClick={onClick}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-[var(--brand-button)] text-black font-display tracking-widest text-sm rounded-xl hover:opacity-90 transition-all">
          <Plus size={14} /> NOVO PRODUTO
        </Link>
        <button onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-400/5 font-body text-sm tracking-wider transition-all">
          <LogOut size={15} /> Sair
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-60 bg-card border-r border-border fixed inset-y-0 left-0 z-30">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
            <motion.aside
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 left-0 z-50 w-60 bg-card border-r border-border lg:hidden">
              <Sidebar onClick={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-card/80 backdrop-blur border-b border-border h-13 flex items-center justify-between px-4">
          <button onClick={() => setOpen(true)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Menu size={16} />
          </button>
          <div className="hidden lg:flex items-center gap-2 text-sm font-body text-muted-foreground">
            <span className="text-[var(--brand-primary)]">Admin</span>
            <ChevronRight size={13} />
            <span className="text-foreground">{NAV.find(n => pathname.startsWith(n.href))?.label || 'Dashboard'}</span>
          </div>
          <div className="lg:hidden font-display text-foreground text-base tracking-widest">ADMIN</div>
          <Link href="/" target="_blank"
            className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
            Ver loja ↗
          </Link>
        </header>

        <main className="flex-1 p-4 md:p-6 relative overflow-hidden">
          <div className="fixed inset-0 pointer-events-none z-0">
            
          </div>
          <div className="relative z-10">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  )
}
