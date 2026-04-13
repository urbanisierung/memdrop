import { isBot } from '../_lib/bot.js'
import { getEvent } from '../_lib/db.js'
import type { Env } from '../_lib/types.js'

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
}

function buildOgTags(
	event: { id: string; name: string },
	host: string,
): string {
	const name = escapeHtml(event.name)
	const imageUrl = `https://${host}/api/events/${event.id}/og-image`
	const pageUrl = `https://${host}/events/${event.id}`
	return `  <meta property="og:title" content="${name}" />
  <meta property="og:description" content="View photos from ${name}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${pageUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${name}" />
  <meta name="twitter:image" content="${imageUrl}" />`
}

export const onRequest: PagesFunction<Env> = async ({
	request,
	env,
	params,
}) => {
	// Fetch index.html from static assets regardless of path
	const indexReq = new Request(new URL('/index.html', request.url).toString())
	const indexRes = await env.ASSETS.fetch(indexReq)

	const ua = request.headers.get('User-Agent') ?? ''
	if (!isBot(ua)) return indexRes

	// Bot: inject event-specific OG tags before </head>
	const id = params.id as string
	const event = await getEvent(env.DB, id)
	if (!event) return indexRes // unknown event — serve plain index.html

	const host = new URL(request.url).host
	const html = await indexRes.text()
	const modified = html.replace(
		'</head>',
		`${buildOgTags(event, host)}\n</head>`,
	)

	return new Response(modified, {
		headers: { 'Content-Type': 'text/html;charset=UTF-8' },
	})
}
