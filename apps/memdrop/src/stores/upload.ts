import { create } from 'zustand'

interface UploadState {
	uploading: boolean
	start: () => void
	finish: () => void
}

export const useUploadStore = create<UploadState>((set) => ({
	uploading: false,
	start: () => set({ uploading: true }),
	finish: () => set({ uploading: false }),
}))
