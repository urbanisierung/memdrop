import type { ApiEvent, ApiImage, DbEvent, DbImage } from './types.js'

export async function getEvent(
	db: D1Database,
	id: string,
): Promise<ApiEvent | null> {
	const row = await db
		.prepare('SELECT * FROM events WHERE id = ?')
		.bind(id)
		.first<DbEvent>()
	if (!row) return null
	return {
		id: row.id,
		name: row.name,
		uploadEnabled: row.upload_enabled === 1,
		viewEnabled: row.view_enabled === 1,
	}
}

export async function getAllEvents(db: D1Database): Promise<ApiEvent[]> {
	const { results } = await db
		.prepare('SELECT * FROM events ORDER BY created_at DESC')
		.all<DbEvent>()
	return results.map((r) => ({
		id: r.id,
		name: r.name,
		uploadEnabled: r.upload_enabled === 1,
		viewEnabled: r.view_enabled === 1,
	}))
}

export async function createEvent(
	db: D1Database,
	event: { id: string; name: string },
): Promise<void> {
	await db
		.prepare(
			'INSERT INTO events (id, name, upload_enabled, view_enabled, created_at) VALUES (?, ?, 1, 1, ?)',
		)
		.bind(event.id, event.name, Date.now())
		.run()
}

export async function updateEventSettings(
	db: D1Database,
	id: string,
	settings: { uploadEnabled: boolean; viewEnabled: boolean },
): Promise<void> {
	await db
		.prepare(
			'UPDATE events SET upload_enabled = ?, view_enabled = ? WHERE id = ?',
		)
		.bind(settings.uploadEnabled ? 1 : 0, settings.viewEnabled ? 1 : 0, id)
		.run()
}

export async function deleteEventData(
	db: D1Database,
	eventId: string,
): Promise<void> {
	await db
		.prepare('DELETE FROM images WHERE event_id = ?')
		.bind(eventId)
		.run()
	await db.prepare('DELETE FROM events WHERE id = ?').bind(eventId).run()
}

export async function getImages(
	db: D1Database,
	eventId: string,
): Promise<ApiImage[]> {
	const { results } = await db
		.prepare(
			'SELECT id, filename, uploaded_at FROM images WHERE event_id = ? ORDER BY uploaded_at DESC',
		)
		.bind(eventId)
		.all<Pick<DbImage, 'id' | 'filename' | 'uploaded_at'>>()
	return results.map((r) => ({
		id: r.id,
		filename: r.filename,
		uploadedAt: r.uploaded_at,
	}))
}

export async function insertImage(
	db: D1Database,
	image: { id: string; eventId: string; filename: string; mimeType: string },
): Promise<void> {
	await db
		.prepare(
			'INSERT INTO images (id, event_id, filename, mime_type, uploaded_at) VALUES (?, ?, ?, ?, ?)',
		)
		.bind(image.id, image.eventId, image.filename, image.mimeType, Date.now())
		.run()
}
