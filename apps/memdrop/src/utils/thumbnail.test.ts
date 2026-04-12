import { describe, it, expect, vi, beforeAll } from 'vitest'
import { generateThumbnail } from './thumbnail.js'

// jsdom doesn't implement Canvas or URL.createObjectURL. Stub the minimal surface used by generateThumbnail.
beforeAll(() => {
	URL.createObjectURL = vi.fn().mockReturnValue('blob:fake')
	URL.revokeObjectURL = vi.fn()

	const ctx = { drawImage: vi.fn() }
	const canvas = {
		width: 0,
		height: 0,
		getContext: () => ctx,
		toBlob: (cb: (b: Blob) => void, type: string) =>
			cb(new Blob(['pixel'], { type })),
	}
	vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
		if (tag === 'canvas') return canvas as unknown as HTMLElement
		return document.createElement(tag)
	})
})

describe('generateThumbnail', () => {
	it('returns a Blob of type image/jpeg', async () => {
		const MockImage = class {
			naturalWidth = 1200
			naturalHeight = 900
			set src(_: string) {
				// biome-ignore lint/suspicious/noExplicitAny: test mock
				;(this as any).onload?.()
			}
		}
		const origImage = globalThis.Image
		globalThis.Image = MockImage as unknown as typeof Image

		const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' })
		const result = await generateThumbnail(file, 400)

		expect(result).toBeInstanceOf(Blob)
		expect(result.type).toBe('image/jpeg')
		globalThis.Image = origImage
	})

	it('does not upscale images smaller than maxWidth', async () => {
		let capturedWidth = 0
		let capturedHeight = 0
		const ctx = { drawImage: vi.fn() }
		const canvas = {
			get width() { return capturedWidth },
			set width(v: number) { capturedWidth = v },
			get height() { return capturedHeight },
			set height(v: number) { capturedHeight = v },
			getContext: () => ctx,
			toBlob: (cb: (b: Blob) => void, type: string) =>
				cb(new Blob(['pixel'], { type })),
		}
		vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
			if (tag === 'canvas') return canvas as unknown as HTMLElement
			return document.createElement(tag)
		})

		const MockImage = class {
			naturalWidth = 200
			naturalHeight = 150
			set src(_: string) {
				// biome-ignore lint/suspicious/noExplicitAny: test mock
				;(this as any).onload?.()
			}
		}
		const origImage = globalThis.Image
		globalThis.Image = MockImage as unknown as typeof Image

		const file = new File(['data'], 'small.jpg', { type: 'image/jpeg' })
		await generateThumbnail(file, 400)

		expect(capturedWidth).toBe(200)  // not upscaled
		globalThis.Image = origImage
	})
})
