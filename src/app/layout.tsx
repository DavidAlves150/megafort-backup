import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from 'next-themes'
import './globals.css'
import { Providers } from '@/components/Providers'
import { getBrandColors } from '@/lib/storefront'
import { brandColors } from '@/lib/brand'


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://vibefitslp.netlify.app"),
  title: {
    default: 'VIBE FITNESS - Suplementos e Moda Fitness em Santa Luzia do Paruá',
    template: '%s | VIBE FITNESS',
  },
  description: 'Whey Protein, Creatina, Pré-Treino, Moda Fitness e muito mais em Santa Luzia do Paruá - MA. Compre pelo WhatsApp!',
  keywords: ['VIBE FITNESS', 'suplementos Santa Luzia do Paruá', 'whey protein Maranhão', 'moda fitness', 'creatina'],
  authors: [{ name: 'VIBE FITNESS' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VIBE FITNESS',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'VIBE FITNESS',
    title: 'VIBE FITNESS - Suplementos e Moda Fitness',
    description: 'Whey Protein, Creatina, Pré-Treino, Moda Fitness em Santa Luzia do Paruá - MA.',
    images: [{ url: '/logo-vibe-fitness.jpeg', alt: 'VIBE FITNESS' }],
  },
  robots: { index: process.env.NEXT_PUBLIC_APP_ENV !== 'homologacao', follow: process.env.NEXT_PUBLIC_APP_ENV !== 'homologacao' },
  icons: { icon: '/logo-vibe-fitness.jpeg', apple: '/logo-vibe-fitness.jpeg' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)',  color: '#0a0a0a' },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const colors = brandColors(await getBrandColors())

  const brandStyles = `
    :root {
      --brand-primary:   ${colors.cor_primaria   || '#F58FA9'};
      --brand-secondary: ${colors.cor_secundaria || '#000000'};
      --brand-button:    ${colors.cor_botao      || '#F58FA9'};
    }
  `

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: brandStyles }} />
      </head>
      <body>
        {process.env.NEXT_PUBLIC_APP_ENV === 'homologacao' && <div className="bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-950">Ambiente de testes — dados fictícios, sem pedidos reais.</div>}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="vibe-fitness-theme">
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
