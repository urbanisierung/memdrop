import { AdminPanel } from './components/AdminPanel.js'
import { GalleryView } from './components/GalleryView.js'
import { useHash } from './router.js'

export function App() {
	const hash = useHash()

	if (hash.startsWith('#/admin')) return <AdminPanel />

	const match = hash.match(/^#\/events\/([^/]+)/)
	if (match) return <GalleryView eventId={match[1]} />

	return (
		<div class="not-found">
			<p>No event found. Check your link.</p>
		</div>
	)
}
