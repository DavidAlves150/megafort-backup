import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Instagram, Phone, Clock, MapPin, MessageCircle } from 'lucide-react'

export const metadata = { title: 'Contato | MegaFort Suplementos' }

export default async function ContatoPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('configuracoes').select('chave,valor')
  const cfg: Record<string,string> = {}
  data?.forEach(c => { if (c.valor) cfg[c.chave] = c.valor })
  const wa = cfg.whatsapp || '5598885916645'

  return (
    <>
      <Header />
      <main className="min-h-screen pt-16">
        <div className="bg-surface-2 border-b border-border px-4 py-10 text-center">
          <span className="font-mono text-[var(--brand-primary)] text-xs tracking-[0.4em] uppercase">Fale conosco</span>
          <h1 className="font-display text-foreground text-4xl md:text-6xl tracking-widest mt-1">CONTATO</h1>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href={`https://wa.me/${wa}`} target="_blank" rel="noopener"
            className="group p-6 bg-card border border-border rounded-2xl hover:border-green-500/30 hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Phone size={22} className="text-green-500" />
            </div>
            <h2 className="font-display text-foreground text-xl tracking-widest mb-1">WHATSAPP</h2>
            <p className="font-body text-green-500 font-semibold">(98) 8591-6645</p>
            <p className="font-body text-muted-foreground text-xs mt-1">Clique para iniciar uma conversa</p>
          </Link>

          <Link href={cfg.instagram || 'https://www.instagram.com/megafort_suplementos'} target="_blank" rel="noopener"
            className="group p-6 bg-card border border-border rounded-2xl hover:border-pink-500/30 hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Instagram size={22} className="text-pink-400" />
            </div>
            <h2 className="font-display text-foreground text-xl tracking-widest mb-1">INSTAGRAM</h2>
            <p className="font-body text-pink-400 font-semibold">@{cfg.instagram_user || 'megafort_suplementos'}</p>
            <p className="font-body text-muted-foreground text-xs mt-1">Siga para novidades diárias</p>
          </Link>

          <div className="p-6 bg-card border border-border rounded-2xl">
            <div className="w-12 h-12 bg-[var(--brand-primary)]/10 rounded-2xl flex items-center justify-center mb-4">
              <Clock size={22} className="text-[var(--brand-primary)]" />
            </div>
            <h2 className="font-display text-foreground text-xl tracking-widest mb-3">HORÁRIO</h2>
            <div className="space-y-2">
              {[
                ['Seg a Sex', cfg.horario_semana || '08h às 18h'],
                ['Sábado',    cfg.horario_sabado || '08h às 11h30'],
                ['Domingo',   'Fechado'],
              ].map(([d, h]) => (
                <div key={d} className="flex justify-between text-sm font-body">
                  <span className="text-muted-foreground">{d}</span>
                  <span className={h === 'Fechado' ? 'text-muted-foreground' : 'text-[var(--brand-primary)] font-semibold'}>{h}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-[var(--brand-primary)]/10 to-[var(--brand-primary)]/3 border border-[var(--brand-primary)]/20 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-[var(--brand-primary)]/15 rounded-2xl flex items-center justify-center mb-4">
                <MessageCircle size={22} className="text-[var(--brand-primary)]" />
              </div>
              <h2 className="font-display text-foreground text-xl tracking-widest mb-2">PRONTO PARA COMPRAR?</h2>
              <p className="font-body text-muted-foreground text-sm">Atendimento pelo WhatsApp. Rápido, prático e seguro.</p>
            </div>
            <Link href={`https://wa.me/${wa}`} target="_blank"
              className="mt-5 flex items-center justify-center gap-2 py-4 bg-[var(--brand-button)] text-black font-display text-lg tracking-widest rounded-xl hover:opacity-90 transition-all">
              FALAR AGORA
            </Link>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
