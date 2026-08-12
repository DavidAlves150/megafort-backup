'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ArrowDownCircle, CalendarDays, DollarSign, Loader2, Plus, ReceiptText, TrendingUp, Trash2, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

type Venda = {
  id: string
  quantidade: number
  valor_venda: number | string
  valor_custo: number | string
  lucro_real: number | string
  canal_venda: string
  data_venda: string
  produto?: { nome?: string } | null
}

type Despesa = {
  id: string
  descricao: string
  categoria: string
  valor: number | string
  data_despesa: string
  recorrente: boolean
  observacoes?: string | null
}

const CATEGORIAS_DESPESA = ['Aluguel', 'Água', 'Energia', 'Internet', 'Marketing', 'Frete', 'Impostos', 'Embalagens', 'Serviços', 'Outros']
const initialExpense = { descricao: '', categoria: 'Outros', valor: '', data_despesa: new Date().toISOString().slice(0, 10), recorrente: false, observacoes: '' }

function numberValue(value: number | string | null | undefined) {
  return Number(value) || 0
}

export default function FinanceiroPage() {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expenseForm, setExpenseForm] = useState(initialExpense)
  const supabase = createClient()

  const period = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return {
      startSales: start.toISOString(),
      startExpense: start.toISOString().slice(0, 10),
      label: now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    }
  }, [])

  async function load() {
    setLoading(true)
    const [{ data: salesData, error: salesError }, { data: expenseData, error: expenseError }] = await Promise.all([
      supabase.from('vendas').select('id,quantidade,valor_venda,valor_custo,lucro_real,canal_venda,data_venda,produto:produtos(nome)').gte('data_venda', period.startSales).order('data_venda', { ascending: false }),
      supabase.from('despesas').select('id,descricao,categoria,valor,data_despesa,recorrente,observacoes').gte('data_despesa', period.startExpense).order('data_despesa', { ascending: false }),
    ])

    if (salesError) toast.error(`Vendas: ${salesError.message}`)
    if (expenseError) toast.error(`Despesas: ${expenseError.message}`)
    setVendas((salesData || []) as Venda[])
    setDespesas((expenseData || []) as Despesa[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const indicadores = useMemo(() => {
    const faturamento = vendas.reduce((total, sale) => total + numberValue(sale.valor_venda) * sale.quantidade, 0)
    const custoMercadorias = vendas.reduce((total, sale) => total + numberValue(sale.valor_custo) * sale.quantidade, 0)
    const lucroBruto = faturamento - custoMercadorias
    const totalDespesas = despesas.reduce((total, expense) => total + numberValue(expense.valor), 0)
    // Saldo líquido representa entradas de vendas menos despesas pagas no período.
    // Lucro líquido também desconta o custo das mercadorias vendidas.
    const saldoLiquido = faturamento - totalDespesas
    const lucroLiquido = lucroBruto - totalDespesas
    return { faturamento, custoMercadorias, lucroBruto, totalDespesas, saldoLiquido, lucroLiquido }
  }, [vendas, despesas])

  const despesasPorCategoria = useMemo(() => {
    return despesas.reduce<Record<string, number>>((acc, expense) => {
      acc[expense.categoria] = (acc[expense.categoria] || 0) + numberValue(expense.valor)
      return acc
    }, {})
  }, [despesas])

  async function saveExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const valor = Number(expenseForm.valor)
    if (!expenseForm.descricao.trim() || !valor || valor <= 0) {
      toast.error('Preencha descrição e valor da despesa.')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.from('despesas').insert({
        descricao: expenseForm.descricao.trim(),
        categoria: expenseForm.categoria,
        valor,
        data_despesa: expenseForm.data_despesa,
        recorrente: expenseForm.recorrente,
        observacoes: expenseForm.observacoes.trim() || null,
      })
      if (error) throw error
      toast.success('Despesa registrada.')
      setExpenseForm(initialExpense)
      setShowForm(false)
      await load()
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível registrar a despesa.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteExpense(expense: Despesa) {
    if (!window.confirm(`Excluir a despesa “${expense.descricao}”?`)) return
    const { error } = await supabase.from('despesas').delete().eq('id', expense.id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Despesa excluída.')
    await load()
  }

  const metricCards = [
    { title: 'Faturamento', value: indicadores.faturamento, icon: TrendingUp, color: 'text-sky-400', background: 'bg-sky-400/10' },
    { title: 'Custo das mercadorias', value: indicadores.custoMercadorias, icon: ReceiptText, color: 'text-orange-400', background: 'bg-orange-400/10' },
    { title: 'Lucro bruto', value: indicadores.lucroBruto, icon: DollarSign, color: 'text-[var(--brand-primary)]', background: 'bg-[var(--brand-primary)]/10' },
    { title: 'Despesas operacionais', value: indicadores.totalDespesas, icon: ArrowDownCircle, color: 'text-red-400', background: 'bg-red-400/10' },
    { title: 'Saldo líquido', value: indicadores.saldoLiquido, icon: Wallet, color: indicadores.saldoLiquido >= 0 ? 'text-violet-400' : 'text-red-400', background: indicadores.saldoLiquido >= 0 ? 'bg-violet-400/10' : 'bg-red-400/10' },
    { title: 'Lucro líquido', value: indicadores.lucroLiquido, icon: DollarSign, color: indicadores.lucroLiquido >= 0 ? 'text-emerald-400' : 'text-red-400', background: indicadores.lucroLiquido >= 0 ? 'bg-emerald-400/10' : 'bg-red-400/10' },
  ]

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-widest text-foreground sm:text-3xl">FINANCEIRO</h1>
          <p className="font-body text-sm text-muted-foreground">Despesas e resultado operacional de {period.label}.</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--brand-button)] px-4 py-2.5 font-display text-xs tracking-widest text-black transition hover:opacity-90">
          <Plus size={16} /> NOVA DESPESA
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 font-body text-xs text-muted-foreground">
        <CalendarDays size={14} className="text-[var(--brand-primary)]" />
        Saldo líquido = faturamento − despesas. Lucro líquido = faturamento − custo das mercadorias − despesas.
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 size={28} className="animate-spin text-[var(--brand-primary)]" /></div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {metricCards.map(card => {
              const Icon = card.icon
              return <div key={card.title} className="min-w-0 rounded-2xl border border-border bg-card p-4">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${card.background}`}><Icon size={18} className={card.color} /></div>
                <p className="font-body text-xs text-muted-foreground">{card.title}</p>
                <p className={`mt-1 truncate font-display text-xl tracking-wide ${card.color}`}>{formatCurrency(card.value)}</p>
              </div>
            })}
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
            <div className="overflow-hidden rounded-2xl border border-border bg-card xl:col-span-3">
              <div className="flex flex-col gap-1 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-lg tracking-widest text-foreground">DESPESAS DO MÊS</h2>
                  <p className="font-body text-xs text-muted-foreground">Água, energia, aluguel, marketing e demais custos operacionais.</p>
                </div>
                <span className="font-mono text-xs text-red-400">{formatCurrency(indicadores.totalDespesas)}</span>
              </div>
              <div className="divide-y divide-border">
                {despesas.slice(0, 8).map(expense => (
                  <div key={expense.id} className="flex items-start gap-3 p-4 sm:items-center">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-red-400"><ArrowDownCircle size={17} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-sm font-semibold text-foreground">{expense.descricao}</p>
                      <p className="font-body text-xs text-muted-foreground">{expense.categoria} · {new Date(`${expense.data_despesa}T12:00:00`).toLocaleDateString('pt-BR')}{expense.recorrente ? ' · Recorrente' : ''}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-mono text-sm text-red-400">{formatCurrency(numberValue(expense.valor))}</span>
                      <button type="button" onClick={() => deleteExpense(expense)} className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-red-400/10 hover:text-red-400" aria-label={`Excluir ${expense.descricao}`}><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
                {despesas.length === 0 && <p className="p-8 text-center font-body text-sm text-muted-foreground">Nenhuma despesa registrada neste mês.</p>}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 xl:col-span-2">
              <h2 className="font-display text-lg tracking-widest text-foreground">DESPESAS POR CATEGORIA</h2>
              <div className="mt-4 space-y-3">
                {Object.entries(despesasPorCategoria).sort((a, b) => b[1] - a[1]).map(([category, value]) => {
                  const ratio = indicadores.totalDespesas ? (value / indicadores.totalDespesas) * 100 : 0
                  return <div key={category}>
                    <div className="mb-1 flex justify-between gap-3 font-body text-sm"><span className="truncate text-foreground">{category}</span><span className="shrink-0 text-muted-foreground">{formatCurrency(value)}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-[var(--brand-primary)]" style={{ width: `${ratio}%` }} /></div>
                  </div>
                })}
                {Object.keys(despesasPorCategoria).length === 0 && <p className="py-7 text-center font-body text-sm text-muted-foreground">Registre despesas para acompanhar a distribuição de custos.</p>}
              </div>
            </div>
          </section>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true">
          <form onSubmit={saveExpense} className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-border bg-card p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div><h2 className="font-display text-xl tracking-widest text-foreground">NOVA DESPESA</h2><p className="font-body text-sm text-muted-foreground">Este valor será descontado do lucro bruto.</p></div>
              <button type="button" onClick={() => !saving && setShowForm(false)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:text-foreground" aria-label="Fechar">×</button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descrição</span><input required className="form-input min-h-11" value={expenseForm.descricao} onChange={event => setExpenseForm({ ...expenseForm, descricao: event.target.value })} placeholder="Ex.: Conta de energia" /></label>
              <label><span className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categoria</span><select className="form-input min-h-11" value={expenseForm.categoria} onChange={event => setExpenseForm({ ...expenseForm, categoria: event.target.value })}>{CATEGORIAS_DESPESA.map(category => <option key={category} value={category}>{category}</option>)}</select></label>
              <label><span className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Valor</span><input required type="number" min="0.01" step="0.01" inputMode="decimal" className="form-input min-h-11" value={expenseForm.valor} onChange={event => setExpenseForm({ ...expenseForm, valor: event.target.value })} placeholder="0,00" /></label>
              <label><span className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data</span><input required type="date" className="form-input min-h-11" value={expenseForm.data_despesa} onChange={event => setExpenseForm({ ...expenseForm, data_despesa: event.target.value })} /></label>
              <label className="flex min-h-11 items-center gap-3 rounded-xl border border-border bg-muted/30 px-3"><input type="checkbox" checked={expenseForm.recorrente} onChange={event => setExpenseForm({ ...expenseForm, recorrente: event.target.checked })} className="h-4 w-4 accent-[var(--brand-primary)]" /><span className="font-body text-sm text-foreground">Despesa recorrente</span></label>
              <label className="sm:col-span-2"><span className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Observações</span><textarea className="form-input min-h-20 resize-y" value={expenseForm.observacoes} onChange={event => setExpenseForm({ ...expenseForm, observacoes: event.target.value })} placeholder="Opcional" /></label>
            </div>
            <button type="submit" disabled={saving} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-button)] px-4 py-3 font-display text-sm tracking-widest text-black transition hover:opacity-90 disabled:opacity-60">{saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}{saving ? 'SALVANDO...' : 'REGISTRAR DESPESA'}</button>
          </form>
        </div>
      )}
    </div>
  )
}
