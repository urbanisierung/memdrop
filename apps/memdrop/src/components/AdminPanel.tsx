import { useEffect, useState } from 'preact/hooks'
import { useAdminStore } from '../stores/admin.js'

function LoginForm() {
	const { login } = useAdminStore()
	const [pw, setPw] = useState('')
	const [shake, setShake] = useState(false)

	const submit = async (e: Event) => {
		e.preventDefault()
		const ok = await login(pw)
		if (!ok) {
			setShake(true)
			setPw('')
			setTimeout(() => setShake(false), 500)
		}
	}

	return (
		<div class="page page--center">
			<h1>Admin</h1>
			<form class="login-form" onSubmit={submit}>
				<input
					type="password"
					placeholder="Password"
					value={pw}
					onInput={(e) => setPw((e.target as HTMLInputElement).value)}
					class={`input${shake ? ' shake' : ''}`}
					// biome-ignore lint/a11y/noAutofocus: intentional — only input on this screen
					autoFocus
				/>
				<button type="submit" class="btn">
					Sign in
				</button>
			</form>
		</div>
	)
}

function EventRow({
	event,
}: {
	event: {
		id: string
		name: string
		uploadEnabled: boolean
		viewEnabled: boolean
	}
}) {
	const { updateEvent, deleteEvent } = useAdminStore()
	const [confirming, setConfirming] = useState(false)
	const link = `${window.location.origin}/events/${event.id}`

	const toggle = (field: 'upload' | 'view', checked: boolean) => {
		updateEvent(
			event.id,
			field === 'upload' ? checked : event.uploadEnabled,
			field === 'view' ? checked : event.viewEnabled,
		)
	}

	return (
		<div class="event-row">
			<div class="event-row__name">{event.name}</div>
			<div class="event-row__id">/{event.id}</div>
			<div class="event-row__controls">
				<label class="toggle">
					<input
						type="checkbox"
						checked={event.uploadEnabled}
						onChange={(e) =>
							toggle('upload', (e.target as HTMLInputElement).checked)
						}
					/>
					<span>Allow uploads</span>
				</label>
				<label class="toggle">
					<input
						type="checkbox"
						checked={event.viewEnabled}
						onChange={(e) =>
							toggle('view', (e.target as HTMLInputElement).checked)
						}
					/>
					<span>Show gallery</span>
				</label>
				<button
					type="button"
					class="btn btn--sm"
					onClick={() => navigator.clipboard.writeText(link)}
				>
					Copy link
				</button>
				{confirming ? (
					<div class="row">
						<span class="event-row__confirm-text">Delete all photos?</span>
						<button
							type="button"
							class="btn btn--sm btn--danger"
							onClick={() => {
								deleteEvent(event.id)
								setConfirming(false)
							}}
						>
							Delete
						</button>
						<button
							type="button"
							class="btn btn--sm btn--secondary"
							onClick={() => setConfirming(false)}
						>
							Cancel
						</button>
					</div>
				) : (
					<button
						type="button"
						class="btn btn--sm btn--danger"
						onClick={() => setConfirming(true)}
					>
						Delete gallery
					</button>
				)}
			</div>
		</div>
	)
}

function NewEventForm({ onDone }: { onDone: () => void }) {
	const { createEvent } = useAdminStore()
	const [id, setId] = useState('')
	const [name, setName] = useState('')

	const submit = async (e: Event) => {
		e.preventDefault()
		if (!id || !name) return
		const ok = await createEvent(id, name)
		if (ok) onDone()
	}

	return (
		<form class="new-event-form" onSubmit={submit}>
			<input
				type="text"
				placeholder="URL id  (e.g. wedding-2026)"
				value={id}
				onInput={(e) => setId((e.target as HTMLInputElement).value)}
				class="input"
				pattern="[a-z0-9-]+"
				title="Lowercase letters, numbers, hyphens only"
				required
			/>
			<input
				type="text"
				placeholder="Event name  (e.g. Sarah & Tom's Wedding)"
				value={name}
				onInput={(e) => setName((e.target as HTMLInputElement).value)}
				class="input"
				required
			/>
			<div class="row">
				<button type="submit" class="btn">
					Create
				</button>
				<button type="button" class="btn btn--secondary" onClick={onDone}>
					Cancel
				</button>
			</div>
		</form>
	)
}

export function AdminPanel() {
	const { state, loadEvents } = useAdminStore()
	const [showNew, setShowNew] = useState(false)

	useEffect(() => {
		if (state.phase === 'unlocked') loadEvents()
	}, [state.phase, loadEvents])

	if (state.phase !== 'unlocked') return <LoginForm />

	return (
		<div class="page">
			<h1>Admin</h1>
			{showNew ? (
				<NewEventForm onDone={() => setShowNew(false)} />
			) : (
				<button type="button" class="btn" onClick={() => setShowNew(true)}>
					+ New event
				</button>
			)}
			<div class="events-list">
				{state.events.length === 0 && (
					<p class="status">No events yet. Create one above.</p>
				)}
				{state.events.map((e) => (
					<EventRow key={e.id} event={e} />
				))}
			</div>
		</div>
	)
}
