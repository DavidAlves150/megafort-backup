'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ProductForm } from '@/components/admin/ProductForm'
import { Produto } from '@/types'

export default function EditarProdutoPage() {
  const { id } = useParams<{ id: string }>()
  const [produto, setProduto] = useState<Produto|null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!id) return
    supabase.from('produtos').select('*, categoria:categorias(*), marca:marcas(*)').eq('id', id).single()
      .then(({ data }) => { setProduto(data as Produto); setLoading(false) })
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <Loader2 size={28} className="text-[var(--brand-primary)] animate-spin"/>
    </div>
  )
  if (!produto) return (
    <div className="text-center py-16">
      <p className="font-body text-muted-foreground">Produto não encontrado.</p>
      <Link href="/admin/produtos" className="text-[var(--brand-primary)] hover:underline font-body text-sm mt-2 block">Voltar</Link>
    </div>
  )
  return <ProductForm produto={produto}/>
}
