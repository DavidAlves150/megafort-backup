'use client'

import { useState } from 'react'
import { ShoppingCart, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface Product {
  id: string
  nome: string
  preco_venda: number | string
  preco_compra?: number | string | null
}

interface RegisterSaleModalProps {
  products: Product[]
  onSaved?: () => void
}

const initialForm = {
  produto_id: '',
  quantidade: 1,
  valor_venda: 0,
  valor_custo: 0,
  canal_venda: 'WhatsApp',
  observacoes: '',
}

export default function RegisterSaleModal({ products, onSaved }: RegisterSaleModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(initialForm)
  const supabase = createClient()

  function close() {
    if (!loading) setOpen(false)
  }

  function handleProductChange(id: string) {
    const product = products.find(p => p.id === id)
    setFormData(current => ({
      ...current,
      produto_id: id,
      valor_venda: product ? Number(product.preco_venda) || 0 : 0,
      valor_custo: product ? Number(product.preco_compra) || 0 : 0,
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!formData.produto_id) {
      toast.error('Selecione um produto.')
      return
    }
    if (formData.quantidade < 1 || formData.valor_venda < 0 || formData.valor_custo < 0) {
      toast.error('Confira quantidade, preço de venda e custo.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('vendas').insert({
        produto_id: formData.produto_id,
        quantidade: formData.quantidade,
        valor_venda: formData.valor_venda,
        valor_custo: formData.valor_custo,
        canal_venda: formData.canal_venda,
        observacoes: formData.observacoes || null,
        data_venda: new Date().toISOString(),
        lucro_real: (formData.valor_venda - formData.valor_custo) * formData.quantidade,
      })
      if (error) throw error

      toast.success('Venda registrada nos Relatórios de Vendas.')
      setFormData(initialForm)
      setOpen(false)
      onSaved?.()
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível registrar a venda.')
    } finally {
      setLoading(false)
    }
  }

  const fieldClass = 'w-full min-h-11 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-base text-foreground outline-none transition focus:border-[var(--brand-primary)]'
  const labelClass = 'mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--brand-button)] px-4 py-2.5 font-display text-xs tracking-widest text-black transition hover:opacity-90"
      >
        <ShoppingCart size={15} /> REGISTRAR VENDA
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true">
          <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-border bg-card p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl tracking-widest text-foreground">NOVA VENDA</h2>
                <p className="font-body text-sm text-muted-foreground">O registro ficará em Relatórios e Vendas.</p>
              </div>
              <button type="button" onClick={close} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition hover:text-foreground" aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Produto</label>
                <select className={fieldClass} onChange={event => handleProductChange(event.target.value)} value={formData.produto_id}>
                  <option value="">Selecione o produto</option>
                  {products.map(product => <option key={product.id} value={product.id}>{product.nome}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Quantidade</label>
                  <input className={fieldClass} type="number" min="1" inputMode="numeric" value={formData.quantidade} onChange={event => setFormData({ ...formData, quantidade: Math.max(1, Number(event.target.value) || 1) })} />
                </div>
                <div>
                  <label className={labelClass}>Canal de venda</label>
                  <select className={fieldClass} value={formData.canal_venda} onChange={event => setFormData({ ...formData, canal_venda: event.target.value })}>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Loja Física">Loja Física</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Preço de venda por unidade</label>
                  <input className={fieldClass} type="number" min="0" step="0.01" inputMode="decimal" value={formData.valor_venda} onChange={event => setFormData({ ...formData, valor_venda: Number(event.target.value) || 0 })} />
                </div>
                <div>
                  <label className={labelClass}>Custo por unidade</label>
                  <input className={fieldClass} type="number" min="0" step="0.01" inputMode="decimal" value={formData.valor_custo} onChange={event => setFormData({ ...formData, valor_custo: Number(event.target.value) || 0 })} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Observações</label>
                <textarea className={`${fieldClass} min-h-20 resize-y`} value={formData.observacoes} onChange={event => setFormData({ ...formData, observacoes: event.target.value })} placeholder="Opcional" />
              </div>

              <button type="submit" disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-button)] px-4 py-3 font-display text-sm tracking-widest text-black transition hover:opacity-90 disabled:opacity-60">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
                {loading ? 'SALVANDO...' : 'CONFIRMAR VENDA'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
