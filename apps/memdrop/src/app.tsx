import { AdminPanel } from './components/AdminPanel.js'
import { GalleryView } from './components/GalleryView.js'
import { useHash } from './router.js'

export function App() {
	const hash = useHash()

	// Path-based event route: used by share links (/events/:id) for OG support.
	// Path is read once at mount — path-based links cause full page loads, so this is correct.
	const pathEventMatch = window.location.pathname.match(/^\/events\/([^/]+)$/)
	if (pathEventMatch) return <GalleryView eventId={pathEventMatch[1]} />

	// Hash-based routes — kept for backwards compatibility
	if (hash.startsWith('#/admin')) return <AdminPanel />
	const hashEventMatch = hash.match(/^#\/events\/([^/]+)/)
	if (hashEventMatch) return <GalleryView eventId={hashEventMatch[1]} />

	return (
		<div class="not-found">
			<p>No event found. Check your link.</p>
		</div>
	)
}
