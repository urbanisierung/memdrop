# Landing Page Design

**Date:** 2026-04-16
**Status:** Approved

## Overview

Replace the bare `"No event found. Check your link."` fallback with a full-screen branded landing page shown whenever the user visits without a valid event path.

## Visual Design

**Direction:** Dark with faded photo-grid backdrop (Option C from brainstorm).

- Background: `#111` with a 5×4 grid of muted gray tiles at ~12% opacity, conveying the photo-sharing purpose without showing real photos.
- A radial gradient overlay (`rgba(17,17,17,0.55 → 0.85)`) ensures text contrast.
- Amber accent (`#f59e0b`) used for wordmark suffix, primary CTA, and creator link hover.
- Page fits entirely on one screen (`100dvh`), no scroll.
- Responsive — works on mobile and desktop.
- Respects existing dark/light mode infrastructure (page is intentionally dark regardless — matches photo viewer aesthetic).

## Content & Layout (centered column, max-width 340px)

1. **Wordmark** — `mem` in white + `drop` in amber, 2.75rem, weight 800.
2. **Tagline** — `"Your event. Your photos. One link."` in muted gray.
3. **Primary CTA** — amber button `"Learn more at u11g.com →"` linking to `https://u11g.com` (opens new tab).
4. **Divider** — `"or enter an event ID"` with horizontal rules on each side.
5. **Event ID row** — text input + `"Go →"` button. On submit, redirects to `/events/:id` using the entered value.
6. **Creator credit** — `"by u11g.com"` pinned to bottom of viewport, links to `https://u11g.com`.

## Interaction

- Input + Go button: trim whitespace from input value; if non-empty, `window.location.href = /events/${id}`.
- Go button also triggers on Enter keypress in the input.
- Primary CTA and creator link both open `https://u11g.com` in a new tab.

## Implementation Scope

- Edit `apps/memdrop/src/app.tsx` — replace the `not-found` div with a `<Landing />` component import.
- Create `apps/memdrop/src/components/Landing.tsx` — self-contained component with inline styles (no new CSS classes needed; keeps changes surgical).
- No new dependencies.
- No changes to routing, stores, or other components.

## Out of Scope

- Animation or transitions on the grid tiles.
- Dark/light mode toggle on this page.
- Any form of event search or autocomplete.
