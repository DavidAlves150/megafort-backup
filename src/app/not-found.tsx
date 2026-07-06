import Link from 'next/link'
import { Header } from '@/components/layout/Header'

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-16 flex flex-col items-center justify-center px-4 text-center">
        <div className="text-[var(--brand-primary)] font-display text-8xl md:text-9xl leading-none mb-4">404</div>
        <h1 className="font-display text-foreground text-3xl md:text-4xl tracking-widest mb-3">PÁGINA NÃO ENCONTRADA</h1>
        <p className="font-body text-muted-foreground text-base mb-8 max-w-sm">
          A página que você procura não existe ou foi movida.
        </p>
        <Link href="/"
          className="flex items-center gap-2 px-8 py-4 bg-[var(--brand-button)] text-black font-display text-lg tracking-widest rounded-2xl hover:opacity-90 transition-all">
          VOLTAR AO INÍCIO
        </Link>
      </main>
    </>
  )
}
