import { getEvent, getImages, insertImage } from '../../../_lib/db.js'
import type { Env } from '../../../_lib/types.js'

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
	const eventId = params.id as string
	const event = await getEvent(env.DB, eventId)
	if (!event) return new Response('Not Found', { status: 404 })
	if (!event.viewEnabled) return Response.json([])
	const images = await getImages(env.DB, eventId)
	return Response.json(images)
}

export const onRequestPost: PagesFunction<Env> = async ({
	request,
	env,
	params,
}) => {
	const eventId = params.id as string
	const event = await getEvent(env.DB, eventId)
	if (!event) return new Response('Not Found', { status: 404 })
	if (!event.uploadEnabled)
		return new Response('Uploads disabled', { status: 403 })

	const form = await request.formData()
	const files = form.getAll('files') as File[]
	const thumbs = form.getAll('thumbs') as File[]

	if (files.length === 0) return new Response('No files', { status: 400 })
	if (files.length !== thumbs.length)
		return new Response('files/thumbs count mismatch', { status: 400 })

	try {
		const created = await Promise.all(
			files.map(async (file, i) => {
				const id = crypto.randomUUID()
				const thumb = thumbs[i]
				await Promise.all([
					env.BUCKET.put(
						`events/${eventId}/orig/${id}`,
						await file.arrayBuffer(),
						{ httpMetadata: { contentType: file.type || 'image/jpeg' } },
					),
					env.BUCKET.put(
						`events/${eventId}/thumb/${id}.jpg`,
						await thumb.arrayBuffer(),
						{ httpMetadata: { contentType: 'image/jpeg' } },
					),
				])
				await insertImage(env.DB, {
					id,
					eventId,
					filename: file.name,
					mimeType: file.type || 'image/jpeg',
				})
				return { id, filename: file.name }
			}),
		)

		return Response.json(created, { status: 201 })
	} catch (err) {
		console.error('Upload failed:', err)
		return new Response('Upload failed', { status: 500 })
	}
}
