import { useCallback, useEffect } from 'preact/hooks'
import { useEventStore } from '../stores/event.js'
import { PhotoGrid } from './PhotoGrid.js'
import { UploadZone } from './UploadZone.js'

interface Props {
	eventId: string
}

export function GalleryView({ eventId }: Props) {
	const {
		load,
		loadMore,
		loading,
		error,
		name,
		uploadEnabled,
		viewEnabled,
		images,
		total,
		loadingMore,
	} = useEventStore()

	useEffect(() => {
		load(eventId)
	}, [eventId, load])

	const handleLoadMore = useCallback(
		() => loadMore(eventId),
		[loadMore, eventId],
	)

	if (loading)
		return (
			<div class="page">
				<p class="status">Loading…</p>
			</div>
		)
	if (error)
		return (
			<div class="page">
				<p class="status error">{error}</p>
			</div>
		)

	return (
		<div class="page">
			<h1 class="event-name">{name}</h1>
			{viewEnabled ? (
				<PhotoGrid
					images={images}
					total={total}
					loadingMore={loadingMore}
					onLoadMore={handleLoadMore}
				/>
			) : (
				<p class="status">Gallery is not available right now.</p>
			)}
			{uploadEnabled && <UploadZone />}
		</div>
	)
}
