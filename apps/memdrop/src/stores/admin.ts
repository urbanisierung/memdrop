import { create } from 'zustand'

interface AdminEvent {
	id: string
	name: string
	uploadEnabled: boolean
	viewEnabled: boolean
}

type AdminState =
	| { phase: 'locked' }
	| { phase: 'loading' }
	| { phase: 'unlocked'; token: string; events: AdminEvent[] }

interface AdminStore {
	state: AdminState
	login: (password: string) => Promise<boolean>
	loadEvents: () => Promise<void>
	createEvent: (id: string, name: string) => Promise<void>
	updateEvent: (
		id: string,
		uploadEnabled: boolean,
		viewEnabled: boolean,
	) => Promise<void>
}

function getStoredToken(): string | null {
	try {
		return sessionStorage.getItem('admin_token')
	} catch {
		return null
	}
}

export const useAdminStore = create<AdminStore>((set, get) => ({
	state: ((): AdminState => {
		const t = getStoredToken()
		return t ? { phase: 'unlocked', token: t, events: [] } : { phase: 'locked' }
	})(),

	login: async (password) => {
		set({ state: { phase: 'loading' } })
		const res = await fetch('/api/admin/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ password }),
		})
		if (!res.ok) {
			set({ state: { phase: 'locked' } })
			return false
		}
		const { token } = (await res.json()) as { token: string }
		sessionStorage.setItem('admin_token', token)
		set({ state: { phase: 'unlocked', token, events: [] } })
		return true
	},

	loadEvents: async () => {
		const s = get().state
		if (s.phase !== 'unlocked') return
		const res = await fetch('/api/admin/events', {
			headers: { Authorization: `Bearer ${s.token}` },
		})
		if (!res.ok) return
		const events = (await res.json()) as AdminEvent[]
		set((cur) => ({
			state:
				cur.state.phase === 'unlocked' ? { ...cur.state, events } : cur.state,
		}))
	},

	createEvent: async (id, name) => {
		const s = get().state
		if (s.phase !== 'unlocked') return
		const res = await fetch('/api/admin/events', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${s.token}`,
			},
			body: JSON.stringify({ id, name }),
		})
		if (!res.ok) return
		const event = (await res.json()) as AdminEvent
		set((cur) => ({
			state:
				cur.state.phase === 'unlocked'
					? { ...cur.state, events: [event, ...cur.state.events] }
					: cur.state,
		}))
	},

	updateEvent: async (id, uploadEnabled, viewEnabled) => {
		const s = get().state
		if (s.phase !== 'unlocked') return
		await fetch(`/api/admin/events/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${s.token}`,
			},
			body: JSON.stringify({ uploadEnabled, viewEnabled }),
		})
		set((cur) => ({
			state:
				cur.state.phase === 'unlocked'
					? {
							...cur.state,
							events: cur.state.events.map((e) =>
								e.id === id ? { ...e, uploadEnabled, viewEnabled } : e,
							),
						}
					: cur.state,
		}))
	},
}))
