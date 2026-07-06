import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

export async function GET() {
  const supabase = await createClient()

  const { data: produtos } = await supabase.from('produtos')
    .select('nome,sku,preco_compra,preco_venda,preco_promocional,estoque,em_destaque,em_promocao,ativo,visualizacoes,criado_em, categoria:categorias(nome), marca:marcas(nome)')
    .order('nome')

  const rows = (produtos || []).map((p: any) => ({
    Nome: p.nome,
    SKU: p.sku || '',
    Categoria: p.categoria?.nome || '',
    Marca: p.marca?.nome || '',
    'Preço Compra (R$)': Number(p.preco_compra).toFixed(2),
    'Preço Venda (R$)': Number(p.preco_venda).toFixed(2),
    'Preço Promo (R$)': p.preco_promocional ? Number(p.preco_promocional).toFixed(2) : '',
    'Lucro Unitário (R$)': (Number(p.preco_venda) - Number(p.preco_compra)).toFixed(2),
    'Margem (%)': p.preco_venda > 0 ? (((p.preco_venda - p.preco_compra) / p.preco_venda) * 100).toFixed(1) : '0',
    Estoque: p.estoque,
    'Lucro Total (R$)': ((Number(p.preco_venda) - Number(p.preco_compra)) * p.estoque).toFixed(2),
    'Valor Estoque (R$)': (Number(p.preco_compra) * p.estoque).toFixed(2),
    Destaque: p.em_destaque ? 'Sim' : 'Não',
    Promoção: p.em_promocao ? 'Sim' : 'Não',
    Ativo: p.ativo ? 'Sim' : 'Não',
    Visualizações: p.visualizacoes,
    'Cadastrado em': new Date(p.criado_em).toLocaleDateString('pt-BR'),
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Produtos')

  // Totals row
  const totalRow = {
    Nome: 'TOTAL',
    Estoque: rows.reduce((a,r)=>a+r.Estoque, 0),
    'Lucro Total (R$)': rows.reduce((a,r)=>a+parseFloat(r['Lucro Total (R$)']), 0).toFixed(2),
    'Valor Estoque (R$)': rows.reduce((a,r)=>a+parseFloat(r['Valor Estoque (R$)']), 0).toFixed(2),
  }
  XLSX.utils.sheet_add_json(wb.Sheets['Produtos'], [totalRow], { skipHeader: true, origin: -1 })

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="megafort-catalogo-${new Date().toISOString().slice(0,10)}.xlsx"`,
    },
  })
}
