# Ember & Oak: bakery & café with a 3D menu

A website for a neighbourhood bakery-café. Pastries and cakes appear as real
**photogrammetry scans** you can turn in your hands. Behind that is the practical side a
small business needs: pickup ordering, table reservations with live availability, and a
kitchen dashboard.

- **The "wow" part:** real 3D scans rendered with React Three Fiber. The stage has soft
  studio lighting, contact shadows, auto-framing for any scan size and a reveal animation,
  and it stops rendering when off-screen. Dishes without a scan fall back to photography.
- **The practical part:** Next.js API routes with Zod validation, server-side pricing, slot
  scheduling in the venue's timezone (DST-safe), serializable table assignment, order and
  booking status flows, a signed admin session, rate limiting and abuse caps.

## Stack

| Layer | Choice |
|---|---|
| App | Next.js 15 (App Router) · React 19 · TypeScript |
| 3D | three.js · @react-three/fiber · @react-three/drei · gltf-transform |
| Styling | Tailwind CSS v4 · Instrument Serif + Inter |
| Data | Prisma 6 · SQLite (swap to Postgres for production) |
| State | Zustand (cart, persisted to localStorage) |
| Validation | Zod 4 |
| Tests | Vitest: 70 unit + integration tests against a separate test SQLite DB |

## Getting started

```bash
cp .env.example .env    # set ADMIN_PASSWORD (12+ chars) and SESSION_SECRET (32+ chars)
npm install
npm run setup           # creates prisma/dev.db and seeds the menu + tables
npm run dev             # http://localhost:3000
```

| Page | What it does |
|---|---|
| `/` | Hero, "In the round" 3D showcase, craft story, visit info |
| `/menu` | Photo-led menu with a 3D viewer for scanned items; add to order |
| `/checkout` | Pickup order, pay at the counter |
| `/order/<code>` | Live order status (auto-refreshes) |
| `/reserve` | Party size, date and time, then book |
| `/admin` | Kitchen dashboard: advance orders, seat or cancel bookings, mark items sold out |

The app refuses weak or placeholder secrets: admin login is disabled until `ADMIN_PASSWORD`
has at least 12 characters, and session signing requires a 32-character `SESSION_SECRET`.

## Adding your own 3D scans

The demo ships with CC0 scans from Poly Haven (see [CREDITS.md](CREDITS.md)). To use your own:

1. **Capture.** In Polycam (Photo mode) or Luma, walk slowly around the item in 2–3 rings at
   different heights, 80–150 photos. Use soft, even light and a matte surface. Glossy glazes
   and glass scan poorly.
2. **Export** as GLB (Polycam: *Export → GLB*; Luma: *Download → Mesh (GLB)*).
3. **Install** under the dish's slug:

   ```bash
   npm run model:add -- ~/Downloads/croissant.glb butter-croissant
   ```

   This runs the pinned `gltf-transform optimize` (WebP textures at most 2048px, meshopt
   compression) and writes `public/models/butter-croissant.glb`. The bundled scans are
   0.25–0.75 MB each.
4. **Reload `/menu`.** Any dish whose slug has a matching `.glb` gets a "View in 3D" label
   and the interactive viewer, auto-scaled and framed. If a model fails to load, its photo
   is shown instead.

Dish slugs and photos are in [`prisma/seed-data.ts`](prisma/seed-data.ts). To host models on a
CDN, set the item's `modelUrl` in the database instead.

## Business rules

All in [`src/lib/config.ts`](src/lib/config.ts):

- Opening hours per weekday (closed Mondays), venue timezone (`NEXT_PUBLIC_RESTAURANT_TIMEZONE`)
- Pickup: first slot 20 min out, 15 min steps, rolling to the next open day; at most 3 open
  orders per email or phone
- Reservations: 30 min slots, 90 min sittings, parties of 1–8, booked 1 hour to 60 days
  ahead; at most 2 upcoming bookings per email or phone
- Tax rate, order limits, admin session length

The floor plan lives in `prisma/seed-data.ts`. A booking gets the smallest free table that
fits, so big tables stay open for big groups. Dishes removed from the seed are **archived**,
not deleted, so order history stays intact.

## Architecture

```
src/
  app/                 pages + API routes (thin: validate → call service → respond)
  components/three/    DishStage (lighting, framing), ScannedDish (GLB loader), hooks
  components/home/     Hero, InTheRound (3D showcase), Craft, Visit
  components/…         menu, cart, forms, admin, layout
  lib/domain/          pure business logic: schedule, tables, pricing, status
  lib/                 config, validation, API envelope, rate limiter, client IP, auth
  server/              data access + use cases: menu, models, orders, reservations
  stores/cart.ts       client cart
prisma/                schema, seed data, seed script
scripts/add-model.sh   scan → optimised GLB
public/models, images  3D scans and photography (credited in CREDITS.md)
tests/                 unit/ and integration/
```

Every API response uses one envelope: `{ success: true, data }` or `{ success: false, error }`.

## Security

- **Prices** come from the database at checkout; the client only sends item IDs and
  quantities. Merged quantities are capped too.
- **Public order page** shows the first name only, never email or phone. Order codes are
  random.
- **Admin session:** an HMAC-signed, `httpOnly`, `SameSite=Strict` cookie, checked in
  middleware and again in every admin handler.
- **Cross-site requests:** non-GET admin API calls require a same-origin `Origin` header,
  and JSON bodies over 16 KB are rejected.
- **Rate limiting** is per IP. On a real host, set `TRUSTED_IP_HEADER` (Vercel: `x-real-ip`,
  Cloudflare: `cf-connecting-ip`). Admin login also has a global cap of 30 attempts per
  15 min, which holds even when IPs are spoofed. The limiter is in memory and bounded; move
  it to Redis before running more than one instance.
- **Bookings** run in a serializable transaction with retry, so two guests can't take the
  same table on Postgres either.
- **Headers:** security headers are set in `next.config.ts`, and `X-Powered-By` is off.

## Testing

```bash
npm test               # 70 unit + integration tests
npm run test:coverage
npm run lint && npm run typecheck
```

Integration tests run against `prisma/test.db`, never your dev database.

## Deploying

1. Switch `provider` in `prisma/schema.prisma` to `postgresql` and point `DATABASE_URL` at a
   hosted Postgres (Neon, Supabase, Railway…).
2. Set `ADMIN_PASSWORD`, `SESSION_SECRET`, `TRUSTED_IP_HEADER`, and optionally
   `NEXT_PUBLIC_RESTAURANT_TIMEZONE`.
3. `npm run build && npm start`, or deploy to Vercel.

## Ideas for next steps

- "View on your table" AR with `<model-viewer>` (Polycam also exports USDZ for iOS)
- Stripe Checkout for prepayment
- Email or SMS confirmations (Resend, Twilio), which would also allow verifying bookings
- Menu and photo editor in the admin
- Store a hashed admin password, or move to per-staff accounts
