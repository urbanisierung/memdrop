export async function generateThumbnail(file: File, maxWidth = 400): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const img = new Image()
		const url = URL.createObjectURL(file)
		img.onload = () => {
			URL.revokeObjectURL(url)
			const w = Math.min(img.naturalWidth, maxWidth)
			const h = Math.round((img.naturalHeight * w) / img.naturalWidth)
			const canvas = document.createElement('canvas')
			canvas.width = w
			canvas.height = h
			const ctx = canvas.getContext('2d')
			if (!ctx) { reject(new Error('No 2d context')); return }
			ctx.drawImage(img, 0, 0, w, h)
			canvas.toBlob(
				(blob) => {
					if (!blob) { reject(new Error('toBlob returned null')); return }
					resolve(blob)
				},
				'image/jpeg',
				0.8,
			)
		}
		img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
		img.src = url
	})
}
