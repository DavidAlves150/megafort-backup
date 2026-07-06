import Link from 'next/link'
import { Instagram, Phone, Clock, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-surface border-t border-surface mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="font-display text-foreground text-2xl tracking-widest">MEGAFORT</div>
            <div className="font-body text-[var(--brand-primary)] text-xs tracking-[0.3em] uppercase mt-0.5">Suplementos</div>
            <p className="font-body text-muted-foreground text-sm mt-3 leading-relaxed">
              A melhor loja de suplementos e moda fitness de Santa Luzia do Paruá - MA.
            </p>
            <Link href="https://www.instagram.com/megafort_suplementos" target="_blank"
              className="inline-flex items-center gap-2 mt-4 px-3 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-sm font-body font-semibold hover:bg-pink-500/20 transition-colors">
              <Instagram size={14} />
              @megafort_suplementos
            </Link>
          </div>

          {/* Categorias */}
          <div>
            <h3 className="font-display text-foreground text-lg tracking-widest mb-4">CATÁLOGO</h3>
            <ul className="space-y-2">
              {[
                ['Whey Protein',    '/catalogo?categoria=whey-protein'],
                ['Creatina',        '/catalogo?categoria=creatina'],
                ['Pré-Treino',      '/catalogo?categoria=pre-treino'],
                ['Moda Fitness',    '/catalogo?categoria=moda-fitness'],
                ['Calçados',        '/catalogo?categoria=calcados'],
                ['Promoções',       '/promocoes'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="font-body text-muted-foreground text-sm hover:text-[var(--brand-primary)] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-display text-foreground text-lg tracking-widest mb-4">LINKS</h3>
            <ul className="space-y-2">
              {[
                ['Início',       '/'],
                ['Sobre nós',    '/sobre'],
                ['Contato',      '/contato'],
                ['Admin',        '/admin'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="font-body text-muted-foreground text-sm hover:text-[var(--brand-primary)] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="font-display text-foreground text-lg tracking-widest mb-4">CONTATO</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Phone size={14} className="text-[var(--brand-primary)] mt-0.5 flex-shrink-0" />
                <div>
                  <Link href="https://wa.me/5598885916645" target="_blank"
                    className="font-body text-muted-foreground text-sm hover:text-[var(--brand-primary)] transition-colors">
                    (98) 8591-6645
                  </Link>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Clock size={14} className="text-[var(--brand-primary)] mt-0.5 flex-shrink-0" />
                <div className="font-body text-muted-foreground text-sm">
                  <p>Seg-Sex: 08h às 18h</p>
                  <p>Sáb: 08h às 11h30</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-[var(--brand-primary)] mt-0.5 flex-shrink-0" />
                <p className="font-body text-muted-foreground text-sm">Santa Luzia do Paruá - MA</p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-surface">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-body text-muted-foreground text-xs text-center">
            © {new Date().getFullYear()} MegaFort Suplementos. Todos os direitos reservados.
          </p>
          <p className="font-body text-muted-foreground text-xs">
            Vendas pelo <span className="text-green-500 font-semibold">WhatsApp</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
