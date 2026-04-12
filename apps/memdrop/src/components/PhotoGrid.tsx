import { useState } from 'preact/hooks'
import { Lightbox } from './Lightbox.js'

interface Image {
	id: string
	filename: string
}

interface Props {
	images: Image[]
}

export function PhotoGrid({ images }: Props) {
	const [selected, setSelected] = useState<string | null>(null)

	if (images.length === 0) return <p class="empty">No photos yet.</p>

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
			{selected && (
				<Lightbox imageId={selected} onClose={() => setSelected(null)} />
			)}
		</>
	)
}
