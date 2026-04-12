import { useEffect } from 'preact/hooks'

interface Props {
	imageId: string
	onClose: () => void
}

export function Lightbox({ imageId, onClose }: Props) {
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}
		document.addEventListener('keydown', handler)
		return () => document.removeEventListener('keydown', handler)
	}, [onClose])

	return (
		// biome-ignore lint/a11y/useSemanticElements: <dialog> requires imperative show/close API incompatible with this declarative pattern
		// biome-ignore lint/a11y/useKeyWithClickEvents: keyboard close is handled by the document-level keydown listener above
		<div class="lightbox" onClick={onClose} role="dialog" aria-modal="true">
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation helper only; no keyboard action needed */}
			<img
				src={`/api/images/${imageId}/orig`}
				alt=""
				class="lightbox__img"
				onClick={(e) => e.stopPropagation()}
			/>
			<button
				type="button"
				class="lightbox__close"
				onClick={onClose}
				aria-label="Close"
			>
				✕
			</button>
		</div>
	)
}
