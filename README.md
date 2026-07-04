# Roovea.com

Next.js App Router + shadcn/ui frontend with PostgreSQL persistence for rooms,
suppliers and customer inquiries.

## Local Setup

1. Copy env:

```bash
cp .env.example .env.local
```

2. Start PostgreSQL:

```bash
docker compose up -d postgres
```

3. Create an admin password hash and place it in `ADMIN_PASSWORD_HASH`:

```bash
npm run auth:hash -- your-password
```

4. Run migrations and seed demo data:

```bash
npm run db:migrate
npm run db:seed
```

5. Start Next.js:

```bash
npm run dev
```

Admin is available at `/admin/login`. User-facing inquiry submissions are saved
from the chat widget to `/admin/messages`.

In local development, if `ADMIN_PASSWORD_HASH` is empty, the fallback login is:
`admin@roovea.local` / `admin123`.

## Notes

- Uploaded room images are stored locally under `public/uploads/rooms` by the
  storage adapter and referenced through DB media records.
- Do not commit real `.env.local` values or generated upload files.
"# roovea.com" 
