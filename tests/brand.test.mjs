import { test } from 'node:test'
import assert from 'node:assert/strict'
import { brandColors, BRAND_DEFAULTS } from '../src/lib/brand.ts'
test('legacy defaults resolve to VIBE without writing to the database', () => {
  assert.deepEqual(brandColors({cor_primaria:'#00FF41',cor_secundaria:'#000000',cor_botao:'#CCFF00'}), BRAND_DEFAULTS)
})
test('valid admin colors work and injected CSS is rejected', () => {
  assert.equal(brandColors({cor_botao:'#123456'}).cor_botao, '#123456')
  assert.equal(brandColors({cor_botao:'red; } body { display:none'}).cor_botao, BRAND_DEFAULTS.cor_botao)
})
