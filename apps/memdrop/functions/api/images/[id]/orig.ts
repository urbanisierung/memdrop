import type { DbImage, Env } from '../../../../_lib/types.js'

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
	const id = params.id as string
	const row = await env.DB.prepare(
		'SELECT event_id, mime_type FROM images WHERE id = ?',
	)
		.bind(id)
		.first<Pick<DbImage, 'event_id' | 'mime_type'>>()
	if (!row) return new Response('Not Found', { status: 404 })

	const obj = await env.BUCKET.get(`events/${row.event_id}/orig/${id}`)
	if (!obj) return new Response('Not Found', { status: 404 })

	return new Response(obj.body, {
		headers: {
			'Content-Type': row.mime_type,
			'Cache-Control': 'public, max-age=31536000, immutable',
		},
	})
}
