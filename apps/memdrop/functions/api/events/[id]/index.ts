import { getEvent } from '../../../_lib/db.js'
import type { Env } from '../../../_lib/types.js'

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
	const event = await getEvent(env.DB, params.id as string)
	if (!event) return new Response('Not Found', { status: 404 })
	return Response.json(event)
}
