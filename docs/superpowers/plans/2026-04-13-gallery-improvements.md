# Gallery Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add gallery deletion, infinite scroll with pagination, performance fixes, upload button relocation, and dynamic per-event OG tags with bot-detection.

**Architecture:** Backend changes in Cloudflare Pages Functions (`functions/`); frontend in Preact + Zustand (`src/`). A new Pages Function at `functions/events/[id].ts` serves as both SPA fallback and bot-detection OG injector. Share links switch from hash (`/#/events/:id`) to path (`/events/:id`) so the server can detect crawlers.

**Tech Stack:** Preact, Zustand, Cloudflare Pages Functions, D1 (SQLite), R2, Vitest, Biome.

---

## File Map

**Created:**
- `functions/_lib/bot.ts` — `isBot(ua)` pure function
- `functions/_lib/bot.test.ts` — unit tests for isBot
- `functions/_lib/og.ts` — `buildOgImage(name)` SVG generator
- `functions/_lib/og.test.ts` — unit tests for buildOgImage
- `functions/api/events/[id]/og-image.ts` — `GET /api/events/:id/og-image` endpoint
- `functions/events/[id].ts` — bot-detection + SPA fallback for `/events/:id`

**Modified:**
- `functions/_lib/types.ts` — add `ASSETS: Fetcher` to `Env`
- `functions/_lib/db.ts` — add `countImages`, `deleteEventData`; add pagination params to `getImages`
- `functions/api/admin/events/[id].ts` — add `onRequestDelete` handler
- `functions/api/events/[id]/images.ts` — paginated response shape `{ images, total }`, cache header
- `src/stores/admin.ts` — add `deleteEvent` action
- `src/stores/event.ts` — add `total`, `loadingMore`, `loadMore`; update `load()` for new API shape
- `src/components/AdminPanel.tsx` — delete button with inline confirm; path-based copy link
- `src/components/PhotoGrid.tsx` — IntersectionObserver sentinel + spinner; new props
- `src/components/GalleryView.tsx` — pass pagination props to PhotoGrid; move UploadZone after PhotoGrid
- `src/styles/main.css` — add `.btn--danger`, `.scroll-sentinel`
- `src/app.tsx` — check `window.location.pathname` for `/events/:id`
- `index.html` — add base OG meta tags

---

## Task 1: Bot detection utility

**Files:**
- Create: `functions/_lib/bot.ts`
- Create: `functions/_lib/bot.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// functions/_lib/bot.test.ts
import { describe, expect, it } from 'vitest'
import { isBot } from './bot.js'

describe('isBot', () => {
  it('detects Twitterbot', () => expect(isBot('Twitterbot/1.0')).toBe(true))
  it('detects Discordbot', () => expect(isBot('Discordbot/2.0')).toBe(true))
  it('detects Slackbot', () => expect(isBot('Slackbot-LinkExpanding 1.0')).toBe(true))
  it('detects TelegramBot', () => expect(isBot('TelegramBot (like TwitterBot)')).toBe(true))
  it('detects LinkedInBot', () => expect(isBot('LinkedInBot/1.0')).toBe(true))
  it('detects facebookexternalhit', () => expect(isBot('facebookexternalhit/1.1')).toBe(true))
  it('detects Googlebot', () => expect(isBot('Googlebot/2.1')).toBe(true))
  it('detects WhatsApp', () => expect(isBot('WhatsApp/2.22.1')).toBe(true))
  it('ignores regular Chrome', () => expect(isBot('Mozilla/5.0 Chrome/120.0.0.0')).toBe(false))
  it('ignores Safari', () => expect(isBot('Mozilla/5.0 AppleWebKit/537.36 Safari/537.36')).toBe(false))
  it('handles empty string', () => expect(isBot('')).toBe(false))
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/memdrop && pnpm test
```

Expected: FAIL — `Cannot find module './bot.js'`

- [ ] **Step 3: Implement isBot**

```ts
// functions/_lib/bot.ts
export function isBot(ua: string): boolean {
  return /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|linkedinbot|discordbot|slack/i.test(
    ua,
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/memdrop && pnpm test
```

Expected: all 11 bot tests PASS

- [ ] **Step 5: Commit**

```bash
git add functions/_lib/bot.ts functions/_lib/bot.test.ts
git commit -m "feat(memdrop): add isBot utility"
```

---

## Task 2: OG image SVG builder

**Files:**
- Create: `functions/_lib/og.ts`
- Create: `functions/_lib/og.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// functions/_lib/og.test.ts
import { describe, expect, it } from 'vitest'
import { buildOgImage } from './og.js'

describe('buildOgImage', () => {
  it('returns a string containing svg root element', () => {
    expect(buildOgImage('Test Event')).toContain('<svg')
  })

  it('includes the event name', () => {
    expect(buildOgImage('My Wedding')).toContain('My Wedding')
  })

  it('escapes HTML entities in name', () => {
    const svg = buildOgImage('Tom & Jerry <Party>')
    expect(svg).toContain('Tom &amp; Jerry &lt;Party&gt;')
    expect(svg).not.toContain('Tom & Jerry')
  })

  it('uses smaller font for long names', () => {
    const short = buildOgImage('Hi')
    const long = buildOgImage('A Very Long Event Name That Goes Beyond Thirty Five Characters')
    expect(short).toContain('font-size="80"')
    expect(long).toContain('font-size="52"')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/memdrop && pnpm test
```

Expected: FAIL — `Cannot find module './og.js'`

- [ ] **Step 3: Implement buildOgImage**

```ts
// functions/_lib/og.ts
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildOgImage(name: string): string {
  const escaped = escapeXml(name)
  const fontSize = name.length > 35 ? 52 : name.length > 20 ? 64 : 80

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0f172a"/>
  <path d="M1080 50 C1080 50 1000 165 1000 225 a80 80 0 0 0 160 0 C1160 165 1080 50 1080 50 Z" fill="#4f8ef7" opacity="0.18"/>
  <path d="M1155 210 C1155 210 1127 257 1127 280 a28 28 0 0 0 56 0 C1183 257 1155 210 1155 210 Z" fill="#4f8ef7" opacity="0.3"/>
  <rect x="80" y="150" width="6" height="330" rx="3" fill="#4f8ef7"/>
  <text x="116" y="330" dominant-baseline="middle" font-family="-apple-system,BlinkMacSystemFont,system-ui,sans-serif" font-size="${fontSize}" font-weight="700" fill="#f8fafc">${escaped}</text>
  <rect x="116" y="400" width="56" height="4" rx="2" fill="#4f8ef7"/>
  <text x="116" y="450" font-family="-apple-system,BlinkMacSystemFont,system-ui,sans-serif" font-size="28" font-weight="600" fill="#4f8ef7">memdrop</text>
</svg>`
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/memdrop && pnpm test
```

Expected: all OG tests PASS

- [ ] **Step 5: Commit**

```bash
git add functions/_lib/og.ts functions/_lib/og.test.ts
git commit -m "feat(memdrop): add OG image SVG builder"
```

---

## Task 3: Delete event — backend

**Files:**
- Modify: `functions/_lib/db.ts` — add `deleteEventData`
- Modify: `functions/api/admin/events/[id].ts` — add `onRequestDelete`

- [ ] **Step 1: Add `deleteEventData` to db.ts**

Add after `updateEventSettings`:

```ts
export async function deleteEventData(
  db: D1Database,
  eventId: string,
): Promise<void> {
  await db
    .prepare('DELETE FROM images WHERE event_id = ?')
    .bind(eventId)
    .run()
  await db.prepare('DELETE FROM events WHERE id = ?').bind(eventId).run()
}
```

Also update the import line at the top of `functions/api/admin/events/[id].ts` — it currently imports:
```ts
import { getEvent, updateEventSettings } from '../../../_lib/db.js'
```
Change to:
```ts
import { deleteEventData, getEvent, getImages, updateEventSettings } from '../../../_lib/db.js'
```

- [ ] **Step 2: Add `onRequestDelete` to `functions/api/admin/events/[id].ts`**

Add after the `onRequestPut` export:

```ts
export const onRequestDelete: PagesFunction<Env> = async ({
  request,
  env,
  params,
}) => {
  if (!(await requireAdmin(request, env.JWT_SECRET)))
    return new Response('Unauthorized', { status: 401 })

  const eventId = params.id as string
  const event = await getEvent(env.DB, eventId)
  if (!event) return new Response('Not Found', { status: 404 })

  // Fetch image IDs before deletion so we can clean up R2
  const images = await getImages(env.DB, eventId)

  // Delete originals and thumbnails from R2
  await Promise.all(
    images.flatMap((img) => [
      env.BUCKET.delete(`events/${eventId}/orig/${img.id}`),
      env.BUCKET.delete(`events/${eventId}/thumb/${img.id}.jpg`),
    ]),
  )

  // Delete image rows then event row from D1
  await deleteEventData(env.DB, eventId)

  return new Response(null, { status: 204 })
}
```

- [ ] **Step 3: Typecheck**

```bash
cd apps/memdrop && pnpm typecheck
```

Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add functions/_lib/db.ts functions/api/admin/events/[id].ts
git commit -m "feat(memdrop): DELETE /api/admin/events/:id — removes event and all images"
```

---

## Task 4: Delete event — frontend

**Files:**
- Modify: `src/stores/admin.ts` — add `deleteEvent` action
- Modify: `src/components/AdminPanel.tsx` — delete button with inline confirm
- Modify: `src/styles/main.css` — add `.btn--danger`

- [ ] **Step 1: Add `deleteEvent` to the admin store**

In `src/stores/admin.ts`, add `deleteEvent` to the `AdminStore` interface:

```ts
interface AdminStore {
  state: AdminState
  login: (password: string) => Promise<boolean>
  loadEvents: () => Promise<void>
  createEvent: (id: string, name: string) => Promise<boolean>
  updateEvent: (
    id: string,
    uploadEnabled: boolean,
    viewEnabled: boolean,
  ) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
}
```

Add the implementation after `updateEvent` in the store body:

```ts
deleteEvent: async (id) => {
  const s = get().state
  if (s.phase !== 'unlocked') return
  const res = await fetch(`/api/admin/events/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${s.token}` },
  })
  if (!res.ok) return
  set((cur) => ({
    state:
      cur.state.phase === 'unlocked'
        ? {
            ...cur.state,
            events: cur.state.events.filter((e) => e.id !== id),
          }
        : cur.state,
  }))
},
```

- [ ] **Step 2: Add `.btn--danger` style**

In `src/styles/main.css`, after the `.btn--secondary` rule:

```css
.btn--danger {
  background: #ef4444;
}
```

- [ ] **Step 3: Update `EventRow` in AdminPanel.tsx**

Replace the entire `EventRow` function (lines 40–96 in the current file) with:

```tsx
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
```

Also add `.event-row__confirm-text` style to `src/styles/main.css`:

```css
.event-row__confirm-text {
  font-size: 0.875rem;
  color: var(--muted);
  align-self: center;
}
```

- [ ] **Step 4: Typecheck and lint**

```bash
cd apps/memdrop && pnpm typecheck && pnpm check
```

Expected: zero errors

- [ ] **Step 5: Commit**

```bash
git add src/stores/admin.ts src/components/AdminPanel.tsx src/styles/main.css
git commit -m "feat(memdrop): delete gallery with inline confirmation in admin panel"
```

---

## Task 5: Paginated images API

**Files:**
- Modify: `functions/_lib/db.ts` — add `countImages`; add `limit`/`offset` params to `getImages`
- Modify: `functions/api/events/[id]/images.ts` — paginated response, cache header

- [ ] **Step 1: Update `getImages` and add `countImages` in db.ts**

Replace the `getImages` function with:

```ts
export async function getImages(
  db: D1Database,
  eventId: string,
  limit = 20,
  offset = 0,
): Promise<ApiImage[]> {
  const { results } = await db
    .prepare(
      'SELECT id, filename, uploaded_at FROM images WHERE event_id = ? ORDER BY uploaded_at DESC LIMIT ? OFFSET ?',
    )
    .bind(eventId, limit, offset)
    .all<Pick<DbImage, 'id' | 'filename' | 'uploaded_at'>>()
  return results.map((r) => ({
    id: r.id,
    filename: r.filename,
    uploadedAt: r.uploaded_at,
  }))
}
```

Add `countImages` after `getImages`:

```ts
export async function countImages(
  db: D1Database,
  eventId: string,
): Promise<number> {
  const row = await db
    .prepare('SELECT COUNT(*) as count FROM images WHERE event_id = ?')
    .bind(eventId)
    .first<{ count: number }>()
  return row?.count ?? 0
}
```

- [ ] **Step 2: Update the images GET handler**

Replace `functions/api/events/[id]/images.ts` `onRequestGet` export with:

```ts
import { countImages, getEvent, getImages, insertImage } from '../../../_lib/db.js'
import type { Env } from '../../../_lib/types.js'

export const onRequestGet: PagesFunction<Env> = async ({
  env,
  params,
  request,
}) => {
  const eventId = params.id as string
  const event = await getEvent(env.DB, eventId)
  if (!event) return new Response('Not Found', { status: 404 })
  if (!event.viewEnabled) return Response.json({ images: [], total: 0 })

  const url = new URL(request.url)
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 20), 100)
  const offset = Math.max(Number(url.searchParams.get('offset') ?? 0), 0)

  const [images, total] = await Promise.all([
    getImages(env.DB, eventId, limit, offset),
    countImages(env.DB, eventId),
  ])

  return Response.json(
    { images, total },
    { headers: { 'Cache-Control': 'public, max-age=60' } },
  )
}
```

Keep the existing `onRequestPost` export unchanged; only replace the import line and `onRequestGet`.

The full file after edits:

```ts
import { countImages, getEvent, getImages, insertImage } from '../../../_lib/db.js'
import type { Env } from '../../../_lib/types.js'

export const onRequestGet: PagesFunction<Env> = async ({
  env,
  params,
  request,
}) => {
  const eventId = params.id as string
  const event = await getEvent(env.DB, eventId)
  if (!event) return new Response('Not Found', { status: 404 })
  if (!event.viewEnabled) return Response.json({ images: [], total: 0 })

  const url = new URL(request.url)
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 20), 100)
  const offset = Math.max(Number(url.searchParams.get('offset') ?? 0), 0)

  const [images, total] = await Promise.all([
    getImages(env.DB, eventId, limit, offset),
    countImages(env.DB, eventId),
  ])

  return Response.json(
    { images, total },
    { headers: { 'Cache-Control': 'public, max-age=60' } },
  )
}

export const onRequestPost: PagesFunction<Env> = async ({
  request,
  env,
  params,
}) => {
  const eventId = params.id as string
  const event = await getEvent(env.DB, eventId)
  if (!event) return new Response('Not Found', { status: 404 })
  if (!event.uploadEnabled)
    return new Response('Uploads disabled', { status: 403 })

  const form = await request.formData()
  const files = form.getAll('files') as File[]
  const thumbs = form.getAll('thumbs') as File[]

  if (files.length === 0) return new Response('No files', { status: 400 })
  if (files.length !== thumbs.length)
    return new Response('files/thumbs count mismatch', { status: 400 })

  try {
    const created = await Promise.all(
      files.map(async (file, i) => {
        const id = crypto.randomUUID()
        const thumb = thumbs[i]
        await Promise.all([
          env.BUCKET.put(
            `events/${eventId}/orig/${id}`,
            await file.arrayBuffer(),
            { httpMetadata: { contentType: file.type || 'image/jpeg' } },
          ),
          env.BUCKET.put(
            `events/${eventId}/thumb/${id}.jpg`,
            await thumb.arrayBuffer(),
            { httpMetadata: { contentType: 'image/jpeg' } },
          ),
        ])
        await insertImage(env.DB, {
          id,
          eventId,
          filename: file.name,
          mimeType: file.type || 'image/jpeg',
        })
        return { id, filename: file.name }
      }),
    )

    return Response.json(created, { status: 201 })
  } catch (err) {
    console.error('Upload failed:', err)
    return new Response('Upload failed', { status: 500 })
  }
}
```

- [ ] **Step 3: Typecheck**

```bash
cd apps/memdrop && pnpm typecheck
```

Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add functions/_lib/db.ts functions/api/events/[id]/images.ts
git commit -m "feat(memdrop): paginate images API — GET returns { images, total }, max 20 per page"
```

---

## Task 6: Event store — pagination state and loadMore

**Files:**
- Modify: `src/stores/event.ts`

- [ ] **Step 1: Replace `src/stores/event.ts` with the paginated version**

```ts
import { create } from 'zustand'

interface Image {
  id: string
  filename: string
  uploadedAt: number
}

interface EventState {
  id: string | null
  name: string
  uploadEnabled: boolean
  viewEnabled: boolean
  images: Image[]
  total: number
  loading: boolean
  loadingMore: boolean
  error: string | null
  load: (eventId: string) => Promise<void>
  loadMore: (eventId: string) => Promise<void>
  addImages: (imgs: { id: string; filename: string }[]) => void
}

export const useEventStore = create<EventState>((set, get) => ({
  id: null,
  name: '',
  uploadEnabled: false,
  viewEnabled: false,
  images: [],
  total: 0,
  loading: false,
  loadingMore: false,
  error: null,

  load: async (eventId) => {
    set({ loading: true, error: null })
    const [eventRes, imagesRes] = await Promise.all([
      fetch(`/api/events/${eventId}`),
      fetch(`/api/events/${eventId}/images?limit=20&offset=0`),
    ])
    if (!eventRes.ok) {
      set({ loading: false, error: 'Event not found.' })
      return
    }
    const event = (await eventRes.json()) as {
      id: string
      name: string
      uploadEnabled: boolean
      viewEnabled: boolean
    }
    const data = imagesRes.ok
      ? ((await imagesRes.json()) as { images: Image[]; total: number })
      : { images: [], total: 0 }
    set({ ...event, images: data.images, total: data.total, loading: false })
  },

  loadMore: async (eventId) => {
    const s = get()
    if (s.loadingMore || s.images.length >= s.total) return
    set({ loadingMore: true })
    const res = await fetch(
      `/api/events/${eventId}/images?limit=20&offset=${s.images.length}`,
    )
    if (!res.ok) {
      set({ loadingMore: false })
      return
    }
    const { images } = (await res.json()) as { images: Image[]; total: number }
    set((prev) => ({
      images: [...prev.images, ...images],
      loadingMore: false,
    }))
  },

  addImages: (imgs) =>
    set((s) => ({
      images: [
        ...imgs.map((i) => ({ ...i, uploadedAt: Date.now() })),
        ...s.images,
      ],
      total: s.total + imgs.length,
    })),
}))
```

Note: `addImages` now also increments `total` so the sentinel hides correctly after a fresh upload.

- [ ] **Step 2: Typecheck**

```bash
cd apps/memdrop && pnpm typecheck
```

Expected: zero errors

- [ ] **Step 3: Commit**

```bash
git add src/stores/event.ts
git commit -m "feat(memdrop): add pagination state and loadMore to event store"
```

---

## Task 7: PhotoGrid — IntersectionObserver; GalleryView — upload button at bottom

**Files:**
- Modify: `src/components/PhotoGrid.tsx`
- Modify: `src/components/GalleryView.tsx`
- Modify: `src/styles/main.css` — add `.scroll-sentinel` and `.spinner`

- [ ] **Step 1: Add scroll utility styles**

In `src/styles/main.css`, after the `.empty` rule:

```css
.scroll-sentinel {
  height: 1px;
}

.load-more-spinner {
  text-align: center;
  padding: 1.5rem 0;
  color: var(--muted);
  font-size: 0.875rem;
}
```

- [ ] **Step 2: Replace `src/components/PhotoGrid.tsx`**

```tsx
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

  if (images.length === 0 && !loadingMore) return <p class="empty">No photos yet.</p>

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
      {images.length < total && <div ref={sentinelRef} class="scroll-sentinel" />}
      {loadingMore && <p class="load-more-spinner">Loading…</p>}
      {selected && (
        <Lightbox imageId={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
```

- [ ] **Step 3: Replace `src/components/GalleryView.tsx`**

```tsx
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
```

Note: `UploadZone` is now rendered after `PhotoGrid` (moved to bottom).

- [ ] **Step 4: Typecheck and lint**

```bash
cd apps/memdrop && pnpm typecheck && pnpm check
```

Expected: zero errors

- [ ] **Step 5: Commit**

```bash
git add src/components/PhotoGrid.tsx src/components/GalleryView.tsx src/styles/main.css
git commit -m "feat(memdrop): infinite scroll via IntersectionObserver; upload button moved to bottom"
```

---

## Task 8: Router — pathname support; AdminPanel — path-based share links

**Files:**
- Modify: `src/app.tsx` — check `window.location.pathname` for `/events/:id`
- Modify: `src/components/AdminPanel.tsx` — copy link uses path URL (already done in Task 4, verify)

- [ ] **Step 1: Update `src/app.tsx`**

Replace the entire file:

```tsx
import { AdminPanel } from './components/AdminPanel.js'
import { GalleryView } from './components/GalleryView.js'
import { useHash } from './router.js'

export function App() {
  const hash = useHash()

  // Path-based event route: used by share links (/events/:id) for OG support.
  // Path is read once at mount — path-based links cause full page loads, so this is correct.
  const pathEventMatch = window.location.pathname.match(/^\/events\/([^/]+)$/)
  if (pathEventMatch) return <GalleryView eventId={pathEventMatch[1]} />

  // Hash-based routes — kept for backwards compatibility
  if (hash.startsWith('#/admin')) return <AdminPanel />
  const hashEventMatch = hash.match(/^#\/events\/([^/]+)/)
  if (hashEventMatch) return <GalleryView eventId={hashEventMatch[1]} />

  return (
    <div class="not-found">
      <p>No event found. Check your link.</p>
    </div>
  )
}
```

- [ ] **Step 2: Verify AdminPanel copy link**

Open `src/components/AdminPanel.tsx`. In `EventRow`, confirm the link is:

```ts
const link = `${window.location.origin}/events/${event.id}`
```

This was set in Task 4. If it still reads `/#/events/`, update it now.

- [ ] **Step 3: Typecheck and lint**

```bash
cd apps/memdrop && pnpm typecheck && pnpm check
```

Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add src/app.tsx src/components/AdminPanel.tsx
git commit -m "feat(memdrop): support path-based /events/:id routing for OG share links"
```

---

## Task 9: OG image endpoint

**Files:**
- Modify: `functions/_lib/types.ts` — add `ASSETS: Fetcher` to `Env`
- Create: `functions/api/events/[id]/og-image.ts`

- [ ] **Step 1: Add `ASSETS` to `Env`**

In `functions/_lib/types.ts`, update the `Env` interface:

```ts
export interface Env {
  DB: D1Database
  BUCKET: R2Bucket
  ADMIN_PASSWORD: string
  JWT_SECRET: string
  ASSETS: Fetcher
}
```

- [ ] **Step 2: Create the OG image endpoint**

```ts
// functions/api/events/[id]/og-image.ts
import { getEvent } from '../../../_lib/db.js'
import { buildOgImage } from '../../../_lib/og.js'
import type { Env } from '../../../_lib/types.js'

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const eventId = params.id as string
  const event = await getEvent(env.DB, eventId)
  if (!event) return new Response('Not Found', { status: 404 })

  const svg = buildOgImage(event.name)
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
```

- [ ] **Step 3: Typecheck**

```bash
cd apps/memdrop && pnpm typecheck
```

Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add functions/_lib/types.ts functions/api/events/[id]/og-image.ts
git commit -m "feat(memdrop): GET /api/events/:id/og-image — dynamic SVG OG image per event"
```

---

## Task 10: Bot-detection Pages Function

**Files:**
- Create: `functions/events/[id].ts`

This function intercepts `/events/:id` requests. Bots get OG-injected HTML. Regular browsers get `index.html` (SPA boots and reads `window.location.pathname`).

- [ ] **Step 1: Create `functions/events/[id].ts`**

```ts
import { getEvent } from '../_lib/db.js'
import { isBot } from '../_lib/bot.js'
import type { Env } from '../_lib/types.js'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildOgTags(
  event: { id: string; name: string },
  host: string,
): string {
  const name = escapeHtml(event.name)
  const imageUrl = `https://${host}/api/events/${event.id}/og-image`
  const pageUrl = `https://${host}/events/${event.id}`
  return `  <meta property="og:title" content="${name}" />
  <meta property="og:description" content="View photos from ${name}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${pageUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${name}" />
  <meta name="twitter:image" content="${imageUrl}" />`
}

export const onRequest: PagesFunction<Env> = async ({
  request,
  env,
  params,
}) => {
  // Fetch index.html from static assets regardless of path
  const indexReq = new Request(
    new URL('/index.html', request.url).toString(),
  )
  const indexRes = await env.ASSETS.fetch(indexReq)

  const ua = request.headers.get('User-Agent') ?? ''
  if (!isBot(ua)) return indexRes

  // Bot: inject event-specific OG tags before </head>
  const id = params.id as string
  const event = await getEvent(env.DB, id)
  if (!event) return indexRes // unknown event — serve plain index.html

  const host = new URL(request.url).host
  const html = await indexRes.text()
  const modified = html.replace('</head>', `${buildOgTags(event, host)}\n</head>`)

  return new Response(modified, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  })
}
```

- [ ] **Step 2: Typecheck**

```bash
cd apps/memdrop && pnpm typecheck
```

Expected: zero errors

- [ ] **Step 3: Commit**

```bash
git add functions/events/[id].ts
git commit -m "feat(memdrop): bot-detection Pages Function injects per-event OG tags at /events/:id"
```

---

## Task 11: Base OG meta tags in index.html

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Update `index.html`**

Replace the current `index.html` with:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta property="og:site_name" content="memdrop" />
    <meta property="og:title" content="memdrop" />
    <meta property="og:description" content="Share photos from your events" />
    <meta property="og:image" content="/favicon.svg" />
    <meta name="twitter:card" content="summary" />
    <title>memdrop</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Typecheck and run tests**

```bash
cd apps/memdrop && pnpm typecheck && pnpm test
```

Expected: zero errors, all tests pass

- [ ] **Step 3: Lint**

```bash
cd apps/memdrop && pnpm check
```

Expected: zero warnings/errors

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(memdrop): add base OG meta tags to index.html"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Delete gallery (admin) — Tasks 3, 4
- [x] Infinite scroll — Tasks 5, 6, 7
- [x] Performance (pagination, cache header, CLS via CSS aspect-ratio already in place) — Tasks 5, 7
- [x] Upload button at bottom — Task 7 (GalleryView)
- [x] Dynamic OG image — Tasks 1, 2, 9, 10
- [x] Base OG tags — Task 11
- [x] Router path support — Task 8
- [x] Path-based copy link — Task 4 (AdminPanel) + Task 8 (verification)

**Note on CLS:** The `.grid__item { aspect-ratio: 1 }` and `.grid__thumb { width: 100%; height: 100% }` CSS rules already prevent layout shift. No explicit `width`/`height` attributes needed on `<img>`.
