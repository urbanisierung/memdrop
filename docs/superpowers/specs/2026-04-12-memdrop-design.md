# memdrop — Design Spec

**Date:** 2026-04-12
**Status:** Approved

## Overview

Event photo sharing app. Users get a link and can upload photos and view the gallery. Owner manages access via an admin panel with a hardcoded password. Everything runs on Cloudflare — no separate server.

---

## Architecture

**App location:** `apps/memdrop/`

**Stack:**
- Preact 10 + Vite SPA (fits existing monorepo)
- Cloudflare Pages (static hosting)
- Cloudflare Pages Functions (API — Workers under the hood, same deployment)
- Cloudflare R2 (image + thumbnail storage)
- Cloudflare D1 (metadata + event settings)
- TypeScript strict, Biome, Vitest

**Single deploy:** `wrangler pages deploy` — frontend + API ship together, no CORS needed.

---

## Cloudflare Resources

### R2 Bucket: `memdrop-images`

```
events/{eventId}/orig/{imageId}        — original upload (preserves original format/extension)
events/{eventId}/thumb/{imageId}.jpg   — 400px-wide JPEG thumbnail (always JPEG)
```

### D1 Database: `memdrop`

```sql
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  upload_enabled INTEGER NOT NULL DEFAULT 1,
  view_enabled INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE TABLE images (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  filename TEXT NOT NULL,        -- original filename including extension
  mime_type TEXT NOT NULL,       -- e.g. "image/jpeg", used when serving original
  uploaded_at INTEGER NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id)
);
```

---

## API Routes (Pages Functions)

All under `/api/`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/events/:id` | Event info + settings |
| GET | `/api/events/:id/images` | All image IDs + filenames |
| POST | `/api/events/:id/images` | Upload images (multipart, multi-file) |
| GET | `/api/images/:id/thumb` | Serve thumbnail from R2 |
| GET | `/api/images/:id/orig` | Serve original from R2 |
| POST | `/api/admin/login` | Validate hardcoded password, return session token |
| GET | `/api/admin/events/:id` | Event settings (admin) |
| PUT | `/api/admin/events/:id` | Toggle upload_enabled / view_enabled |
| POST | `/api/admin/events` | Create new event |

**Admin auth:** JWT signed with a secret env var, stored in `sessionStorage`. Hardcoded password validated server-side.

---

## Upload + Thumbnail Flow

1. User selects N files via `<input type="file" multiple accept="image/*">`
2. Frontend POSTs multipart form to `/api/events/:id/images`
3. Worker validates `upload_enabled` — returns 403 if disabled
4. For each file in parallel:
   - Generate UUID as image ID
   - Decode image bytes
   - Use `@cf-wasm/photon` (WASM) to resize to max 400px wide, encode as JPEG thumbnail
   - `Promise.all`: write original + thumbnail to R2
   - Insert row into D1
5. Return array of created image objects `{ id, filename }`

---

## Frontend Views

Hash-based client-side routing (no library — plain `window.location.hash`).

### `/#/events/:id` — Gallery + Upload

- Event name at top
- Upload zone: full-width tap target, "Tap to add photos", `<input type="file" multiple accept="image/*" capture>`
- Upload progress: "Uploading 3 of 7..." inline text, no spinner library
- Photo grid: 2 columns on mobile, thumbnails lazy-loaded via `loading="lazy"`
- Tap thumbnail → lightbox overlay, fetches original from `/api/images/:id/orig`
- One API call on load: GET all image IDs → browser lazy-loads thumbs as they scroll into view
- `upload_enabled=false`: upload zone hidden
- `view_enabled=false`: grid hidden, friendly message shown

### `/#/admin` — Management Panel

- Password input on first visit; correct password → JWT stored in `sessionStorage`
- Wrong password: input shakes, clears
- Per event: name, two toggles (Allow uploads / Show gallery), Copy link button
- Create event: inline form (name + URL id)

---

## Design

- Mobile-first, single column
- Colors: black/white + warm amber accent (`#F59E0B`)
- Font: `system-ui` — no web fonts, zero extra requests
- Touch targets: min 48px height
- No nav bar — views are self-contained
- Lightbox is the only overlay (besides new-event inline form)

---

## State Management

Zustand stores (per monorepo convention):

- `eventStore` — event data, settings, image list
- `uploadStore` — upload queue, per-file progress
- `adminStore` — auth state, admin event list

---

## Security

- Admin password never stored client-side — only JWT after successful login
- JWT signed with `ADMIN_SECRET` env var (set in CF Pages dashboard)
- All admin API routes validate JWT
- R2 bucket is private — images served only through API Worker
- No presigned URLs exposed to clients

---

## Not In Scope

- Multiple users / accounts
- Comments or reactions
- Download-all ZIP
- Push notifications
- Image captions
