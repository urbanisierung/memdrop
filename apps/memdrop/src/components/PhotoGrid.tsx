import { useEffect, useRef, useState } from 'preact/hooks'
import { Lightbox } from './Lightbox.js'

interface Image {
	id: string
	filename: string
}

interface Props {
	images: Image[]
	total: number
	loadingMore: boolean
	onLoadMore: () => void
}

export function PhotoGrid({ images, total, loadingMore, onLoadMore }: Props) {
	const [selected, setSelected] = useState<string | null>(null)
	const sentinelRef = useRef<HTMLDivElement>(null)
	const onLoadMoreRef = useRef(onLoadMore)
	onLoadMoreRef.current = onLoadMore

	useEffect(() => {
		if (images.length >= total || !sentinelRef.current) return
		const el = sentinelRef.current
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) onLoadMoreRef.current()
			},
			{ rootMargin: '200px' },
		)
		observer.observe(el)
		return () => observer.disconnect()
	}, [images.length, total])

	if (images.length === 0 && !loadingMore)
		return <p class="empty">No photos yet.</p>

	return (
		<>
			<div class="grid">
				{images.map((img) => (
					<button
						type="button"
						key={img.id}
						class="grid__item"
						onClick={() => setSelected(img.id)}
						aria-label={img.filename}
					>
						<img
							src={`/api/images/${img.id}/thumb`}
							alt={img.filename}
							loading="lazy"
							class="grid__thumb"
						/>
					</button>
				))}
			</div>
			{images.length < total && (
				<div ref={sentinelRef} class="scroll-sentinel" />
			)}
			{loadingMore && <p class="load-more-spinner">Loading…</p>}
			{selected && (
				<Lightbox imageId={selected} onClose={() => setSelected(null)} />
			)}
		</>
	)
}
