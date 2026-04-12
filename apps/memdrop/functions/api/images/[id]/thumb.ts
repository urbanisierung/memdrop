import type { DbImage, Env } from '../../../../_lib/types.js'

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
	const id = params.id as string
	const row = await env.DB.prepare('SELECT event_id FROM images WHERE id = ?')
		.bind(id)
		.first<Pick<DbImage, 'event_id'>>()
	if (!row) return new Response('Not Found', { status: 404 })

	const obj = await env.BUCKET.get(`events/${row.event_id}/thumb/${id}.jpg`)
	if (!obj) return new Response('Not Found', { status: 404 })

	return new Response(obj.body, {
		headers: {
			'Content-Type': 'image/jpeg',
			'Cache-Control': 'public, max-age=31536000, immutable',
		},
	})
}
