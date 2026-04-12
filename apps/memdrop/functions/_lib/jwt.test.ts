import { describe, expect, it } from 'vitest'
import { signJWT, verifyJWT } from './jwt.js'

const SECRET = 'test-secret'

describe('signJWT / verifyJWT', () => {
	it('round-trips a payload', async () => {
		const token = await signJWT({ role: 'admin', iat: 1000 }, SECRET)
		const result = await verifyJWT(token, SECRET)
		expect(result).toMatchObject({ role: 'admin', iat: 1000 })
	})

	it('returns null for wrong secret', async () => {
		const token = await signJWT({ role: 'admin' }, SECRET)
		expect(await verifyJWT(token, 'wrong')).toBeNull()
	})

	it('returns null for tampered payload', async () => {
		const token = await signJWT({ role: 'admin' }, SECRET)
		const [h, , s] = token.split('.')
		const tampered = `${h}.${btoa(JSON.stringify({ role: 'superadmin' }))}.${s}`
		expect(await verifyJWT(tampered, SECRET)).toBeNull()
	})

	it('returns null for malformed token', async () => {
		expect(await verifyJWT('not.a.token.at.all', SECRET)).toBeNull()
		expect(await verifyJWT('', SECRET)).toBeNull()
	})

	it('returns null for expired token', async () => {
		const past = Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
		const token = await signJWT({ role: 'admin', exp: past }, SECRET)
		expect(await verifyJWT(token, SECRET)).toBeNull()
	})

	it('accepts non-expired token', async () => {
		const future = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
		const token = await signJWT({ role: 'admin', exp: future }, SECRET)
		expect(await verifyJWT(token, SECRET)).not.toBeNull()
	})
})
