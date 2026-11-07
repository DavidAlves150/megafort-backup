import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isAdministrator } from '../src/lib/admin-access.ts'
test('anonymous and ordinary accounts cannot administer', () => {
  assert.equal(isAdministrator(null), false)
  assert.equal(isAdministrator({app_metadata: {}}), false)
  assert.equal(isAdministrator({user_metadata: {role: 'admin'}}), false)
})
test('server-managed administrative role is required', () => {
  assert.equal(isAdministrator({app_metadata: {role: 'admin'}}), true)
  assert.equal(isAdministrator({app_metadata: {role: 'customer'}}), false)
})
