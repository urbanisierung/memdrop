const ALG = { name: 'HMAC', hash: 'SHA-256' } as const

function b64url(input: string): string {
	return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function b64urlDecode(input: string): string {
	return atob(input.replace(/-/g, '+').replace(/_/g, '/'))
}

async function importKey(secret: string): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		ALG,
		false,
		['sign', 'verify'],
	)
}

export async function signJWT(
	payload: Record<string, unknown>,
	secret: string,
): Promise<string> {
	const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
	const body = b64url(JSON.stringify(payload))
	const key = await importKey(secret)
	const raw = await crypto.subtle.sign(
		ALG,
		key,
		new TextEncoder().encode(`${header}.${body}`),
	)
	return `${header}.${body}.${b64url(String.fromCharCode(...new Uint8Array(raw)))}`
}

export async function verifyJWT(
	token: string,
	secret: string,
): Promise<Record<string, unknown> | null> {
	const parts = token.split('.')
	if (parts.length !== 3) return null
	const [header, body, sig] = parts
	try {
		const key = await importKey(secret)
		const sigBytes = Uint8Array.from(b64urlDecode(sig), (c) => c.charCodeAt(0))
		const valid = await crypto.subtle.verify(
			ALG,
			key,
			sigBytes,
			new TextEncoder().encode(`${header}.${body}`),
		)
		if (!valid) return null
		const parsed = JSON.parse(b64urlDecode(body)) as Record<string, unknown>
		if (typeof parsed.exp === 'number' && Date.now() / 1000 > parsed.exp) return null
		return parsed
	} catch {
		return null
	}
}
