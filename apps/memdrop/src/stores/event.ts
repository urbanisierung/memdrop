import { create } from 'zustand'

interface Image {
	id: string
	filename: string
	uploadedAt: number
}

interface EventState {
	id: string | null
	name: string
	uploadEnabled: boolean
	viewEnabled: boolean
	images: Image[]
	loading: boolean
	error: string | null
	load: (eventId: string) => Promise<void>
	addImages: (imgs: { id: string; filename: string }[]) => void
}

export const useEventStore = create<EventState>((set) => ({
	id: null,
	name: '',
	uploadEnabled: false,
	viewEnabled: false,
	images: [],
	loading: false,
	error: null,

	load: async (eventId) => {
		set({ loading: true, error: null })
		const [eventRes, imagesRes] = await Promise.all([
			fetch(`/api/events/${eventId}`),
			fetch(`/api/events/${eventId}/images`),
		])
		if (!eventRes.ok) {
			set({ loading: false, error: 'Event not found.' })
			return
		}
		const event = (await eventRes.json()) as {
			id: string
			name: string
			uploadEnabled: boolean
			viewEnabled: boolean
		}
		const images = imagesRes.ok ? ((await imagesRes.json()) as Image[]) : []
		set({ ...event, images, loading: false })
	},

	addImages: (imgs) =>
		set((s) => ({
			images: [
				...imgs.map((i) => ({ ...i, uploadedAt: Date.now() })),
				...s.images,
			],
		})),
}))
