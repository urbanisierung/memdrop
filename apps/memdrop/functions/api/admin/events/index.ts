import { createEvent, getAllEvents } from '../../../_lib/db.js'
import type { Env } from '../../../_lib/types.js'
import { requireAdmin } from '../../../_lib/types.js'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
	if (!(await requireAdmin(request, env.JWT_SECRET)))
		return new Response('Unauthorized', { status: 401 })
	const events = await getAllEvents(env.DB)
	return Response.json(events)
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
	if (!(await requireAdmin(request, env.JWT_SECRET)))
		return new Response('Unauthorized', { status: 401 })
	let body: { id?: string; name?: string }
	try {
		body = await request.json()
	} catch {
		return new Response('Bad Request', { status: 400 })
	}
	if (!body.id || !body.name)
		return new Response('Bad Request', { status: 400 })
	await createEvent(env.DB, { id: body.id, name: body.name })
	return Response.json(
		{ id: body.id, name: body.name, uploadEnabled: true, viewEnabled: true },
		{ status: 201 },
	)
}
