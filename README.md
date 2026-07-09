# Roovea.com

Next.js App Router + shadcn/ui frontend with PostgreSQL persistence for rooms,
suppliers and customer inquiries.

## Local Setup

1. Copy env:

```bash
cp .env.example .env.local
```

2. Start PostgreSQL without Docker:

```bash
npm run db:local:start
```

This uses the local PostgreSQL binaries from `D:\PostgreSQL_16\bin` by default
and stores dev data under `.dev-postgres/`.

If you prefer Docker, you can still run:

```bash
docker compose up -d postgres
```

The compose file exposes Postgres on `localhost:55432` to avoid conflicts with
any local Postgres service already using `5432`.

3. Generate secrets for `.env.local`:

```bash
npm run auth:secrets
```

Copy the printed `ADMIN_SESSION_SECRET` and `FIELD_ENCRYPTION_KEY` values into
`.env.local`.

4. Create an admin account for local testing:

```bash
npm run auth:setup -- admin@example.com your-strong-password
```

This updates `.env.local` with `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH`, and
removes the local-only `ADMIN_PASSWORD` fallback.

Alternatively, you can generate only the hash and paste it manually into
`ADMIN_PASSWORD_HASH`:

```bash
npm run auth:hash -- your-password
```

Set `ADMIN_EMAIL` to the admin email you want to use. In production, keep only
`ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH`; do not set `ADMIN_PASSWORD`.

5. Run migrations and seed demo data:

```bash
npm run db:migrate
npm run db:seed
```

6. Start Next.js:

```bash
npm run dev
```

Admin is available at `/admin/login`. User-facing inquiry submissions are saved
from the chat widget to `/admin/messages`.

In local development, if `ADMIN_PASSWORD_HASH` is empty, the fallback login is:
`admin@roovea.local` / `admin123`.

## Production Check

Before deploying, run:

```bash
npm run prod:check
npm run typecheck
npm run lint
npm run build
```

## Notes

- Uploaded room images are stored locally under `ROOM_UPLOAD_DIR` when set, or
  `.data/uploads/rooms` by default, and are served from `/uploads/rooms/...`.
  Existing files under `public/uploads/rooms` are still read as a fallback.
- Do not commit real `.env.local` values or generated upload files.
