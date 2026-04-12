import { useRef } from 'preact/hooks'
import { useEventStore } from '../stores/event.js'
import { useUploadStore } from '../stores/upload.js'
import { generateThumbnail } from '../utils/thumbnail.js'

export function UploadZone() {
	const inputRef = useRef<HTMLInputElement>(null)
	const { uploading, start, finish } = useUploadStore()
	const { id: eventId, addImages } = useEventStore()

	const handleFiles = async (fileList: FileList) => {
		if (!eventId || fileList.length === 0) return
		const files = Array.from(fileList)
		start()

		try {
			// Generate all thumbnails in parallel before uploading
			const thumbs = await Promise.all(files.map((f) => generateThumbnail(f)))

			const form = new FormData()
			for (let i = 0; i < files.length; i++) {
				form.append('files', files[i])
				form.append('thumbs', thumbs[i], `${files[i].name}.thumb.jpg`)
			}

			const res = await fetch(`/api/events/${eventId}/images`, {
				method: 'POST',
				body: form,
			})

			if (res.ok) {
				const created = (await res.json()) as { id: string; filename: string }[]
				addImages(created)
			}
		} finally {
			finish()
			// Reset input so the same files can be re-selected if needed
			if (inputRef.current) inputRef.current.value = ''
		}
	}

	return (
		<div class="upload">
			<input
				ref={inputRef}
				type="file"
				multiple
				accept="image/*"
				class="upload__input"
				onChange={(e) => {
					const files = (e.target as HTMLInputElement).files
					if (files?.length) handleFiles(files)
				}}
			/>
			<button
				type="button"
				class="upload__btn"
				onClick={() => inputRef.current?.click()}
				disabled={uploading}
				aria-busy={uploading}
			>
				{uploading ? 'Uploading…' : 'Tap to add photos'}
			</button>
		</div>
	)
}
