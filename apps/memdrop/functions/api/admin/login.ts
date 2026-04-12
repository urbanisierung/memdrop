import { signJWT } from '../../_lib/jwt.js'
import type { Env } from '../../_lib/types.js'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
	let body: { password?: string }
	try {
		body = await request.json()
	} catch {
		return new Response('Bad Request', { status: 400 })
	}
	if (body.password !== env.ADMIN_PASSWORD) {
		return new Response('Unauthorized', { status: 401 })
	}
	const exp = Math.floor(Date.now() / 1000) + 86400 // 24h
	const token = await signJWT(
		{ role: 'admin', iat: Math.floor(Date.now() / 1000), exp },
		env.JWT_SECRET,
	)
	return Response.json({ token })
}
