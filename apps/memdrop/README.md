# memdrop

A simple, mobile-first photo sharing app for events like weddings. Guests get a link to upload and view photos. An admin panel lets you toggle upload/view access per event.

**Stack:** Preact + Vite · Cloudflare Pages Functions · Cloudflare R2 (images) · Cloudflare D1 (metadata)

---

## How It Works

- **Admin** creates events at `/#/admin` and shares the event link with guests
- **Guests** open `/#/events/YOUR_EVENT_ID` to upload photos and view the gallery
- Uploads generate client-side thumbnails before sending, so the gallery loads fast

---

## Prerequisites

- Cloudflare account (free tier is fine)
- `wrangler` CLI authenticated: `wrangler login`
- `pnpm` installed

---

## One-Time Cloudflare Setup

### 1. Create R2 Bucket

```bash
wrangler r2 bucket create memdrop-images
```

### 2. Create D1 Database

```bash
wrangler d1 create memdrop
```

Copy the `database_id` from the output into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "memdrop"
database_id = "PASTE_YOUR_DATABASE_ID_HERE"
```

### 3. Run Database Migration

Local:
```bash
wrangler d1 execute memdrop --local --file=./migrations/0001_init.sql
```

Production:
```bash
wrangler d1 execute memdrop --remote --file=./migrations/0001_init.sql
```

---

## Local Development

Create `apps/memdrop/.dev.vars` (gitignored):

```
ADMIN_PASSWORD=choose-a-strong-password
JWT_SECRET=choose-a-random-string-at-least-32-chars
```

Start the dev server:

```bash
pnpm dev
# or from the repo root:
pnpm dev --filter=memdrop
```

Opens at `http://localhost:5173`.

---

## App URLs

| Page | URL |
|------|-----|
| Guest upload & gallery | `/#/events/YOUR_EVENT_ID` |
| Admin panel | `/#/admin` |

Log in to the admin panel with the password from `.dev.vars` (local) or the `ADMIN_PASSWORD` env var (production).

---

## Admin Panel

1. Go to `/#/admin` and enter your admin password
2. Click **+ New event** and fill in:
   - **URL id** — used in the share link, e.g. `wedding-2026`
   - **Event name** — displayed to guests, e.g. `Sarah & Tom's Wedding`
3. Click **Copy link** to get the guest URL: `https://YOUR_DOMAIN/#/events/wedding-2026`
4. Use the **Allow uploads** and **Show gallery** toggles to control access per event

---

## Deploying to Cloudflare Pages

### First Deploy

```bash
pnpm build
wrangler pages deploy dist/ --project-name=memdrop
```

This creates the Pages project automatically.

### Bind D1 and R2 (Dashboard — one time)

1. Cloudflare Dashboard → Workers & Pages → `memdrop` → Settings → Functions
2. Add **D1 database binding**: variable name `DB`, database `memdrop`
3. Add **R2 bucket binding**: variable name `BUCKET`, bucket `memdrop-images`

### Set Production Secrets (Dashboard — one time)

Cloudflare Dashboard → Workers & Pages → `memdrop` → Settings → Environment Variables

Add both as **Encrypted**:
- `ADMIN_PASSWORD` — your chosen admin password
- `JWT_SECRET` — a random string ≥ 32 chars (`openssl rand -hex 32`)

### Redeploy After Changes

```bash
pnpm build
wrangler pages deploy dist/ --project-name=memdrop
```

### Custom Domain (Optional)

Cloudflare Dashboard → Workers & Pages → `memdrop` → Custom Domains

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `database_id placeholder` error | Replace `PLACEHOLDER_REPLACE_AFTER_CF_SETUP` in `wrangler.toml` with the real ID from step 2 |
| Upload returns 403 | "Allow uploads" toggle is off in admin panel |
| Gallery shows blank | "Show gallery" toggle is off in admin panel |
| Images not appearing after upload | Check R2 bucket binding name is exactly `BUCKET` |
| Admin login fails in production | Verify `ADMIN_PASSWORD` is set in CF dashboard |
| Upload button stays disabled | Network error during upload — check browser console |
