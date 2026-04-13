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
	total: number
	loading: boolean
	loadingMore: boolean
	error: string | null
	load: (eventId: string) => Promise<void>
	loadMore: (eventId: string) => Promise<void>
	addImages: (imgs: { id: string; filename: string }[]) => void
}

export const useEventStore = create<EventState>((set, get) => ({
	id: null,
	name: '',
	uploadEnabled: false,
	viewEnabled: false,
	images: [],
	total: 0,
	loading: false,
	loadingMore: false,
	error: null,

	load: async (eventId) => {
		set({ loading: true, error: null })
		const [eventRes, imagesRes] = await Promise.all([
			fetch(`/api/events/${eventId}`),
			fetch(`/api/events/${eventId}/images?limit=20&offset=0`),
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
		const data = imagesRes.ok
			? ((await imagesRes.json()) as { images: Image[]; total: number })
			: { images: [], total: 0 }
		set({ ...event, images: data.images, total: data.total, loading: false })
	},

	loadMore: async (eventId) => {
		const s = get()
		if (s.loadingMore || s.images.length >= s.total) return
		set({ loadingMore: true })
		const res = await fetch(
			`/api/events/${eventId}/images?limit=20&offset=${s.images.length}`,
		)
		if (!res.ok) {
			set({ loadingMore: false })
			return
		}
		const { images } = (await res.json()) as { images: Image[]; total: number }
		set((prev) => ({
			images: [...prev.images, ...images],
			loadingMore: false,
		}))
	},

	addImages: (imgs) =>
		set((s) => ({
			images: [
				...imgs.map((i) => ({ ...i, uploadedAt: Date.now() })),
				...s.images,
			],
			total: s.total + imgs.length,
		})),
}))
