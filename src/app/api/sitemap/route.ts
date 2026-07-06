import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://megafort.netlify.app'

  const [{ data: produtos }, { data: categorias }, { data: marcas }] = await Promise.all([
    supabase.from('produtos').select('slug,atualizado_em').eq('ativo', true),
    supabase.from('categorias').select('slug,atualizado_em').eq('ativa', true),
    supabase.from('marcas').select('slug,atualizado_em').eq('ativa', true),
  ])

  const statics = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/catalogo', priority: '0.9', changefreq: 'daily' },
    { url: '/promocoes', priority: '0.9', changefreq: 'daily' },
    { url: '/sobre', priority: '0.6', changefreq: 'monthly' },
    { url: '/contato', priority: '0.6', changefreq: 'monthly' },
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${statics.map(p => `  <url><loc>${base}${p.url}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`).join('\n')}
${(categorias||[]).map(c => `  <url><loc>${base}/catalogo?categoria=${c.slug}</loc><lastmod>${c.atualizado_em}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`).join('\n')}
${(marcas||[]).map(m => `  <url><loc>${base}/catalogo?marca=${m.slug}</loc><lastmod>${m.atualizado_em}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`).join('\n')}
${(produtos||[]).map(p => `  <url><loc>${base}/produto/${p.slug}</loc><lastmod>${p.atualizado_em}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`).join('\n')}
</urlset>`

  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' } })
}
