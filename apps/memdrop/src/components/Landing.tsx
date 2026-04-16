import { useRef } from 'preact/hooks'

export function Landing() {
	const inputRef = useRef<HTMLInputElement>(null)

	function go() {
		const id = inputRef.current?.value.trim()
		if (id) window.location.href = `/events/${id}`
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') go()
	}

	return (
		<div style={styles.landing}>
			{/* Decorative photo-grid backdrop via CSS background */}
			<div style={styles.gridBg} />

			<div style={styles.content}>
				<div style={styles.wordmark}>
					mem<span style={styles.accent}>drop</span>
				</div>
				<p style={styles.tagline}>Your event. Your photos. One link.</p>

				<a
					href="https://u11g.com"
					target="_blank"
					rel="noopener noreferrer"
					style={styles.primaryBtn}
				>
					Learn more at u11g.com →
				</a>

				<div style={styles.dividerWrap}>
					<div style={styles.dividerLine} />
					<span style={styles.dividerText}>or enter an event ID</span>
					<div style={styles.dividerLine} />
				</div>

				<div style={styles.eventRow}>
					<input
						ref={inputRef}
						style={styles.input}
						placeholder="Event ID"
						onKeyDown={onKeyDown}
					/>
					<button type="button" style={styles.goBtn} onClick={go}>
						Go →
					</button>
				</div>
			</div>

			<div style={styles.creator}>
				by{' '}
				<a
					href="https://u11g.com"
					target="_blank"
					rel="noopener noreferrer"
					style={styles.creatorLink}
				>
					u11g.com
				</a>
			</div>
		</div>
	)
}

// CSS background trick to render a 5×4 grid of tiles without JSX array mapping
const gridBgImage = [
	// vertical separators (every 20%)
	'repeating-linear-gradient(90deg, transparent, transparent calc(20% - 3px), #111 calc(20% - 3px), #111 20%)',
	// horizontal separators (every 25%)
	'repeating-linear-gradient(180deg, transparent, transparent calc(25% - 3px), #111 calc(25% - 3px), #111 25%)',
].join(', ')

const styles = {
	landing: {
		position: 'relative' as const,
		width: '100%',
		height: '100dvh',
		display: 'flex',
		flexDirection: 'column' as const,
		alignItems: 'center',
		justifyContent: 'center',
		gap: '1.25rem',
		overflow: 'hidden',
		padding: '2rem 1.5rem',
		background: '#111',
		color: '#f9fafb',
		fontFamily: 'system-ui, sans-serif',
	},
	gridBg: {
		position: 'absolute' as const,
		inset: 0,
		backgroundImage: gridBgImage,
		backgroundColor: '#4b5563',
		opacity: 0.12,
		pointerEvents: 'none' as const,
	},
	content: {
		position: 'relative' as const,
		display: 'flex',
		flexDirection: 'column' as const,
		alignItems: 'center',
		gap: '1.25rem',
		textAlign: 'center' as const,
		maxWidth: '340px',
		width: '100%',
	},
	wordmark: {
		fontSize: '2.75rem',
		fontWeight: 800,
		letterSpacing: '-0.05em',
		color: '#fff',
	},
	accent: {
		color: '#f59e0b',
	},
	tagline: {
		fontSize: '1rem',
		color: '#9ca3af',
		lineHeight: 1.55,
	},
	primaryBtn: {
		display: 'block',
		width: '100%',
		padding: '0.85rem 1.5rem',
		background: '#f59e0b',
		color: '#111',
		fontWeight: 700,
		fontSize: '1rem',
		border: 'none',
		borderRadius: '8px',
		cursor: 'pointer',
		textDecoration: 'none',
	},
	dividerWrap: {
		width: '100%',
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
	},
	dividerLine: {
		flex: 1,
		height: '1px',
		background: '#374151',
	},
	dividerText: {
		color: '#6b7280',
		fontSize: '0.75rem',
		whiteSpace: 'nowrap' as const,
	},
	eventRow: {
		display: 'flex',
		width: '100%',
		gap: '0.5rem',
	},
	input: {
		flex: 1,
		padding: '0.75rem 1rem',
		background: 'rgba(255,255,255,0.07)',
		border: '1px solid #374151',
		borderRadius: '8px',
		color: '#f9fafb',
		fontSize: '0.95rem',
		outline: 'none',
	},
	goBtn: {
		padding: '0.75rem 1rem',
		background: 'transparent',
		border: '1px solid #374151',
		borderRadius: '8px',
		color: '#f9fafb',
		fontWeight: 600,
		fontSize: '0.95rem',
		cursor: 'pointer',
		whiteSpace: 'nowrap' as const,
	},
	creator: {
		position: 'absolute' as const,
		bottom: '1.5rem',
		fontSize: '0.75rem',
		color: '#4b5563',
	},
	creatorLink: {
		color: '#f59e0b',
		textDecoration: 'none',
	},
}
