import { verifyJWT } from './jwt.js'

export interface Env {
	DB: D1Database
	BUCKET: R2Bucket
	ADMIN_PASSWORD: string
	JWT_SECRET: string
}

// DB row shapes (snake_case from D1)
export interface DbEvent {
	id: string
	name: string
	upload_enabled: 0 | 1
	view_enabled: 0 | 1
	created_at: number
}

export interface DbImage {
	id: string
	event_id: string
	filename: string
	mime_type: string
	uploaded_at: number
}

// API shapes (camelCase for frontend)
export interface ApiEvent {
	id: string
	name: string
	uploadEnabled: boolean
	viewEnabled: boolean
}

export interface ApiImage {
	id: string
	filename: string
	uploadedAt: number
}

export async function requireAdmin(
	request: Request,
	jwtSecret: string,
): Promise<boolean> {
	const auth = request.headers.get('Authorization') ?? ''
	const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
	const payload = await verifyJWT(token, jwtSecret)
	return payload?.role === 'admin'
}
