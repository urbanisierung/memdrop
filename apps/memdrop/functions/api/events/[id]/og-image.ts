import { getEvent } from '../../../_lib/db.js'
import { buildOgImage } from '../../../_lib/og.js'
import type { Env } from '../../../_lib/types.js'

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
	const eventId = params.id as string
	const event = await getEvent(env.DB, eventId)
	if (!event) return new Response('Not Found', { status: 404 })

	const svg = buildOgImage(event.name)
	return new Response(svg, {
		headers: {
			'Content-Type': 'image/svg+xml',
			'Cache-Control': 'public, max-age=3600',
		},
	})
}
