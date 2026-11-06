import { test } from 'node:test'
import assert from 'node:assert/strict'
import { produtoSchema } from '../src/lib/validations/index.ts'
const base = { nome: 'Camiseta', preco_compra: 20, preco_venda: 50, estoque: 8 }
test('optional selectors and blank promotional price do not block saving', () => {
  const value = produtoSchema.parse({ ...base, categoria_id: '', marca_id: '', preco_promocional: NaN })
  assert.equal(value.categoria_id, null)
  assert.equal(value.preco_promocional, null)
  assert.equal(value.estoque, 8)
})
test('negative or fractional stocks and invalid promotional prices are rejected', () => {
  for (const estoque of [-1, 1.5]) assert.equal(produtoSchema.safeParse({ ...base, estoque }).success, false)
  for (const preco_promocional of [0, -1, 50, 60]) assert.equal(produtoSchema.safeParse({ ...base, preco_promocional }).success, false)
})
