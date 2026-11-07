import test from 'node:test'
import assert from 'node:assert/strict'
import { storeDate } from '../src/lib/store-date.ts'

test('store date stays on previous day before midnight in Brazil', () => {
  assert.equal(storeDate('2026-11-07T00:45:00Z'), '2026-11-06')
  assert.equal(storeDate('2026-11-07T03:00:00Z'), '2026-11-07')
  assert.equal(storeDate('2027-01-01T02:59:59Z'), '2026-12-31')
})
