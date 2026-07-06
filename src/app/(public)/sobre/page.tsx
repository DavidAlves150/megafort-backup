import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Instagram, Phone, Clock, MapPin, Heart, Target, Star } from 'lucide-react'

export const metadata = { title: 'Sobre | MegaFort Suplementos' }

export default async function SobrePage() {
  const supabase = await createClient()
  const { data } = await supabase.from('configuracoes').select('chave,valor')
  const cfg: Record<string,string> = {}
  data?.forEach(c => { if (c.valor) cfg[c.chave] = c.valor })

  return (
    <>
      <Header />
      <main className="min-h-screen pt-16">
        <div className="bg-surface-2 border-b border-border px-4 py-12 text-center">
          <span className="font-mono text-[var(--brand-primary)] text-xs tracking-[0.4em] uppercase">Conheça</span>
          <h1 className="font-display text-foreground text-4xl md:text-6xl tracking-widest mt-1">MEGAFORT</h1>
          <p className="font-body text-muted-foreground text-base mt-2">{cfg.slogan || 'A melhor loja de suplementos e moda da região'}</p>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
          {cfg.sobre_historia && (
            <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4"><Heart size={20} className="text-[var(--brand-primary)]" /><h2 className="font-display text-foreground text-2xl tracking-widest">NOSSA HISTÓRIA</h2></div>
              <p className="font-body text-muted-foreground leading-relaxed">{cfg.sobre_historia}</p>
            </section>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cfg.sobre_missao && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3"><Target size={18} className="text-[var(--brand-primary)]" /><h3 className="font-display text-foreground text-xl tracking-widest">MISSÃO</h3></div>
                <p className="font-body text-muted-foreground text-sm leading-relaxed">{cfg.sobre_missao}</p>
              </div>
            )}
            {cfg.sobre_valores && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3"><Star size={18} className="text-[var(--brand-primary)]" /><h3 className="font-display text-foreground text-xl tracking-widest">VALORES</h3></div>
                <p className="font-body text-muted-foreground text-sm leading-relaxed">{cfg.sobre_valores}</p>
              </div>
            )}
          </div>

          <section className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-4">
            <h2 className="font-display text-foreground text-2xl tracking-widest mb-4">INFORMAÇÕES</h2>
            {[
              { icon: MapPin, text: cfg.cidade || 'Santa Luzia do Paruá - MA' },
              { icon: Clock, text: (cfg.horario_semana || 'Seg-Sex: 08h às 18h') + ' · ' + (cfg.horario_sabado || 'Sáb: 08h às 11h30') },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <Icon size={16} className="text-[var(--brand-primary)] mt-0.5 flex-shrink-0" />
                <p className="font-body text-muted-foreground text-sm">{text}</p>
              </div>
            ))}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Link href={`https://wa.me/${cfg.whatsapp || '5598885916645'}`} target="_blank"
                className="flex items-center justify-center gap-2 px-5 py-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl font-body font-semibold text-sm hover:bg-green-500/20 transition-colors">
                <Phone size={15} /> WhatsApp
              </Link>
              <Link href={cfg.instagram || 'https://www.instagram.com/megafort_suplementos'} target="_blank"
                className="flex items-center justify-center gap-2 px-5 py-3 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl font-body font-semibold text-sm hover:bg-pink-500/20 transition-colors">
                <Instagram size={15} /> Instagram
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
