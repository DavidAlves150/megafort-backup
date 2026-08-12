import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from 'next-themes'
import './globals.css'
import { Providers } from '@/components/Providers'
import { getBrandColors } from '@/lib/storefront'

export const metadata: Metadata = {
  title: {
    default: 'MegaFort Suplementos - Suplementos e Moda Fitness em Santa Luzia do Paruá',
    template: '%s | MegaFort Suplementos',
  },
  description: 'Whey Protein, Creatina, Pré-Treino, Moda Fitness e muito mais em Santa Luzia do Paruá - MA. Compre pelo WhatsApp!',
  keywords: ['MegaFort Suplementos', 'suplementos Santa Luzia do Paruá', 'whey protein Maranhão', 'moda fitness', 'creatina'],
  authors: [{ name: 'MegaFort Suplementos' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MegaFort',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'MegaFort Suplementos',
    title: 'MegaFort Suplementos - Suplementos e Moda Fitness',
    description: 'Whey Protein, Creatina, Pré-Treino, Moda Fitness em Santa Luzia do Paruá - MA.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
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
  const colors = await getBrandColors()

  const brandStyles = `
    :root {
      --brand-primary:   ${colors.cor_primaria   || '#00FF41'};
      --brand-secondary: ${colors.cor_secundaria || '#000000'};
      --brand-button:    ${colors.cor_botao      || '#00FF41'};
    }
  `

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: brandStyles }} />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="megafort-theme">
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
