# Earthlight

Science-based circadian lighting schedules for architects and lighting professionals. Generates intensity and color-temperature curves across a 24-hour day, with ROI modeling and shareable report snapshots.

## Stack

- **Next.js 16** App Router, React 18, TypeScript
- **Clerk** for authentication (`@clerk/nextjs`)
- **Drizzle ORM** on **Neon Postgres** (`@neondatabase/serverless`)
- **Tailwind CSS** + **shadcn/ui** (Radix primitives)
- Deployed on **Vercel**

## Getting started

Requires Node.js 20+ and npm. Then:

```sh
git clone https://github.com/PhinonceLabs/earthlight.git
cd earthlight
npm install
cp .env.example .env.local   # then fill in the values below
npm run db:migrate           # apply Drizzle migrations to your Neon DB
npm run dev                  # http://localhost:3000
```

### Environment variables

Required for runtime:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend key |
| `CLERK_SECRET_KEY` | Clerk backend key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/projects` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/projects` |

`npm run db:generate` is the one script that works without `DATABASE_URL` — it uses a placeholder in `drizzle.config.ts` so migrations can be authored offline.

## Scripts

```sh
npm run dev          # next dev
npm run build        # next build
npm run start        # next start (after build)
npm run lint         # eslint flat config
npm run typecheck    # next typegen && tsc --noEmit
npm run db:generate  # drizzle-kit generate
npm run db:migrate   # drizzle-kit migrate (requires DATABASE_URL)
npm run db:studio    # drizzle-kit studio  (requires DATABASE_URL)
```

There is no test runner. `lint` and `typecheck` are the only automated gates.

## Project layout

- `src/app/` — App Router routes. Public landing at `/`; authenticated shell under `(app)/` for `/projects` and `/reports/[reportId]`; Clerk catch-all routes at `/sign-in` and `/sign-up`.
- `src/proxy.ts` — Clerk auth gate (Next.js 16 replaces `middleware.ts` with `proxy.ts`).
- `src/features/<name>/` — feature slices, each with `queries.ts` (server-only DTOs), `actions.ts` (server actions returning `ActionResult<T>`), and `components/` (client). Slices: `projects`, `scenarios`, `roi`, `reports`, `export`.
- `src/server/` — `db/` (Drizzle schema + Neon driver), `auth/` (Clerk → app-user identity, project authorization), `validation/` (Zod), `lighting/` (server-side sun-time fetch), `domain/` (constants).
- `src/domain/` — pure domain logic shared with the client (ROI calculator, validation shapes).
- `src/utils/` — lighting standards and schedule generator (`generateCustomSchedule`, `getCurrentLightSettings`).
- `src/components/ui/` — generated shadcn primitives (extend via props, do not edit in place).

See `CLAUDE.md` for architecture conventions, the server-action contract, and known gotchas.

## Deployment

Deploys to Vercel from `main`. Set the environment variables above in the Vercel project settings; the build runs `next build`. Drizzle migrations are not run automatically — run `npm run db:migrate` against the production `DATABASE_URL` as part of release.
