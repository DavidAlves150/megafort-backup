import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { produto_id, tipo = 'whatsapp' } = body

    if (!produto_id) return NextResponse.json({ ok: false }, { status: 400 })

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const ip_hash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16)
    const user_agent = req.headers.get('user-agent') || ''

    const supabase = await createClient()
    await supabase.from('click_tracking').insert([{ produto_id, tipo, ip_hash, user_agent }])

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
