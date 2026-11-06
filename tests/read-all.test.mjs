import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readAll } from '../src/lib/read-all.ts'

test('loads more than 20 sales, including server-capped pages', async () => {
  const records = Array.from({length: 1201}, (_, id) => ({id}))
  const result = await readAll(async from => ({data: records.slice(from, from + 100), error: null}))
  assert.deepEqual(result.data, records)
})
test('does not expose partial totals after a page failure', async () => {
  const result = await readAll(async from => from === 0 ? {data: [{id: 1}], error: null} : {data: null, error: {message: 'failure'}})
  assert.equal(result.data, null)
  assert.equal(result.error.message, 'failure')
})
test('handles an empty dataset', async () => {
  assert.deepEqual(await readAll(async () => ({data: [], error: null})), {data: [], error: null})
})
