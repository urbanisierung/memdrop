import {
	deleteEventData,
	getEvent,
	getImages,
	updateEventSettings,
} from '../../../_lib/db.js'
import type { Env } from '../../../_lib/types.js'
import { requireAdmin } from '../../../_lib/types.js'

export const onRequestGet: PagesFunction<Env> = async ({
	request,
	env,
	params,
}) => {
	if (!(await requireAdmin(request, env.JWT_SECRET)))
		return new Response('Unauthorized', { status: 401 })
	const event = await getEvent(env.DB, params.id as string)
	if (!event) return new Response('Not Found', { status: 404 })
	return Response.json(event)
}

export const onRequestPut: PagesFunction<Env> = async ({
	request,
	env,
	params,
}) => {
	if (!(await requireAdmin(request, env.JWT_SECRET)))
		return new Response('Unauthorized', { status: 401 })
	let body: { uploadEnabled?: boolean; viewEnabled?: boolean }
	try {
		body = await request.json()
	} catch {
		return new Response('Bad Request', { status: 400 })
	}
	if (body.uploadEnabled === undefined || body.viewEnabled === undefined) {
		return new Response('Bad Request', { status: 400 })
	}
	const existing = await getEvent(env.DB, params.id as string)
	if (!existing) return new Response('Not Found', { status: 404 })
	await updateEventSettings(env.DB, params.id as string, {
		uploadEnabled: body.uploadEnabled,
		viewEnabled: body.viewEnabled,
	})
	return new Response(null, { status: 204 })
}

export const onRequestDelete: PagesFunction<Env> = async ({
	request,
	env,
	params,
}) => {
	if (!(await requireAdmin(request, env.JWT_SECRET)))
		return new Response('Unauthorized', { status: 401 })

	const eventId = params.id as string
	const event = await getEvent(env.DB, eventId)
	if (!event) return new Response('Not Found', { status: 404 })

	// Fetch image IDs before deletion so we can clean up R2
	const images = await getImages(env.DB, eventId)

	// Delete originals and thumbnails from R2
	await Promise.all(
		images.flatMap((img) => [
			env.BUCKET.delete(`events/${eventId}/orig/${img.id}`),
			env.BUCKET.delete(`events/${eventId}/thumb/${img.id}.jpg`),
		]),
	)

	// Delete image rows then event row from D1
	await deleteEventData(env.DB, eventId)

	return new Response(null, { status: 204 })
}
