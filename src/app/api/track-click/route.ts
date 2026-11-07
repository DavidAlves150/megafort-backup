import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { produto_id, tipo = 'whatsapp' } = body

    if (typeof produto_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(produto_id) || !['whatsapp', 'view'].includes(tipo)) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const ip_hash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16)
    const user_agent = req.headers.get('user-agent') || ''

    const supabase = await createClient()
    const { error } = await supabase.from('click_tracking').insert([{ produto_id, tipo, ip_hash, user_agent }])
    if (error) return NextResponse.json({ ok: false }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
