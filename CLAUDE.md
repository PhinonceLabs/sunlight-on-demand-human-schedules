# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

"Earthlight" — a Next.js 16 App Router app (React 18, TypeScript, Tailwind/shadcn) that generates science-based circadian lighting schedules (intensity + color temperature over a 24-hour day) for architects and lighting professionals. Authenticated via Clerk; persisted in Neon Postgres via Drizzle ORM.

The repo was rebuilt on Next.js from a Vite SPA POC in commit `f34650a Rebuild POC on Next.js with Clerk and Drizzle`. The Lovable project metadata (`project id e9d549f3-…`) and parts of the README still reference the old Vite stack — trust the code, not those.

## Commands

```bash
npm i              # install
npm run dev        # next dev (default port 3000)
npm run build      # next build
npm run start      # next start (run after build)
npm run lint       # eslint flat config (eslint.config.js)
npm run typecheck  # next typegen && tsc --noEmit  — gate for TS errors
npm run db:generate  # drizzle-kit generate  (no DB connection needed)
npm run db:migrate   # drizzle-kit migrate    (requires DATABASE_URL)
npm run db:studio    # drizzle-kit studio     (requires DATABASE_URL)
```

There is no test runner. `npm run lint` and `npm run typecheck` are the only automated gates.

`DATABASE_URL` (Neon Postgres connection string) and Clerk env vars (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and the Clerk URL overrides) must be set for runtime. `drizzle-kit generate` is the one command that works without `DATABASE_URL` — it falls back to a placeholder in `drizzle.config.ts` so migrations can be authored offline.

## Architecture

**Auth gate is `src/proxy.ts`, not `middleware.ts`.** Next.js 16 renamed Clerk middleware's host file to `proxy.ts`. It calls `clerkMiddleware` and forces auth on `/projects(.*)`, `/reports(.*)`, `/api(.*)`. The matcher also runs for `/__clerk/(.*)` so Clerk's frontend-API proxy keeps working. Do not reintroduce `middleware.ts`.

**Route layout.**

- `src/app/page.tsx` — public landing; redirects signed-in users to `/projects`.
- `src/app/(app)/layout.tsx` — authenticated shell. Calls `auth.protect()` and renders the global header.
- `src/app/(app)/projects/`, `src/app/(app)/reports/[reportId]/` — protected views.
- `src/app/sign-in/[[...rest]]/`, `src/app/sign-up/[[...rest]]/` — Clerk catch-all routes.
- `src/app/layout.tsx` wraps everything in `<ClerkProvider>`; `src/app/providers.tsx` is the client provider tree (`next-themes`, tooltip, two toasters).

**Feature slices live in `src/features/<name>/` and follow a strict three-file pattern:**

- `queries.ts` — top of file is `import "server-only"`. Returns DTOs (string dates, plain objects), never raw Drizzle rows.
- `actions.ts` — top of file is `"use server"`. Validates input with the matching Zod schema from `src/server/validation/`, calls `requireAppIdentity()`, performs the mutation, and calls `revalidatePath`. Returns a typed `ActionResult<T> = { ok: true; data: T } | { ok: false; message; fieldErrors? }`.
- `components/` — `"use client"` components consuming the actions.

Slices today: `projects`, `scenarios`, `roi`, `reports`, `export` (export is serializers only).

**Server-side auth & authorization (`src/server/auth/`):**

- `identity.ts` — `requireClerkIdentity()` reads Clerk; `getOrCreateCurrentAppUser()` lazily inserts an `app_users` row on first sight (via `onConflictDoUpdate` to survive concurrent first-seen requests); `requireAppIdentity()` is the standard entry point used by every server action.
- `authorization.ts` — `canAccessProject` / `assertCanAccessProject` and the predicates `projectAccessWhere(identity)` and `projectIdAccessWhere(projectId, identity)` that you compose into Drizzle `where` clauses. **Org access is intentionally coarse**: any member of the matching Clerk org currently has access to org-owned projects — the file documents this. Add role/membership checks before exposing differentiated org permissions.
- Authorization rule: **never trust client-supplied owner/org IDs**; always derive ownership from `requireAppIdentity()` on the server (see `features/projects/actions.ts:47`).

**Database (`src/server/db/`):**

- `index.ts` — Neon HTTP driver + Drizzle. Throws at import time if `DATABASE_URL` is missing. `import "server-only"` enforces server-only use.
- `schema.ts` — `app_users`, `projects`, `scenarios`, `roi_snapshots`, `report_snapshots`. Lighting schedules, ROI inputs/assumptions/results, and report payloads are all `jsonb`. Two Postgres enums (`project_type`, `scenario_source`) are sourced from `src/server/domain/constants.ts` (which re-exports `src/domain/constants.ts`) — change the constants there and regenerate migrations.
- `migrations/` — output of `drizzle-kit generate`. Regenerate after any schema edit; do not hand-edit.

**Domain math:**

- `src/utils/lightingStandards.ts` and `src/utils/scheduleGenerator.ts` carry over from the Vite POC and are still the canonical schedule shapes (`TimeIntensityPair`, `LightingSchedule`) and pure functions (`generateCustomSchedule`, `getCurrentLightSettings`, formatters). The `jsonb` snapshot types in `schema.ts` (`LightingScheduleSnapshot`, `LightingExposurePointSnapshot`) mirror these — keep them in sync when extending the schedule shape.
- `src/utils/scheduleGenerator.ts` still exports `fetchSunTimes` (client-side, sunrise-sunset.org). The server-side equivalent is `src/server/lighting/sunTimes.ts` — it validates with Zod, has a 5s `AbortController` timeout, and converts UTC instants to the requested IANA timezone. **Server actions/queries should use the server version**; the client `fetchSunTimes` is kept for the legacy visualizer components in `src/components/`.
- `src/domain/roi/` — ROI calculator and assumptions; `assumptionsVersion` is persisted on each `roi_snapshots` row so historical snapshots remain interpretable when assumptions change.
- `src/server/validation/` — Zod schemas for each feature (project, scenario, roi, report, lighting). Server actions consume these; `src/domain/validation/` mirrors shared shapes for client use.

**UI layer.**

- shadcn primitives in `src/components/ui/` are generated — extend via props/className or rerun the CLI, do not edit in place. `components.json` is configured with `rsc: true` and `baseColor: slate`; shadcn CSS lives at `src/app/globals.css`.
- Legacy visualizer/calculator/report components from the Vite POC remain in `src/components/` (`LightingSchedule.tsx`, `ScheduleVisualizer.tsx`, `ROICalculator.tsx`, `FinalReport.tsx`, etc.). The Next.js port wraps these inside feature client components (e.g. `features/roi/components/ROICalculatorClient.tsx`). Prefer extending via the feature slice; only touch the legacy components when changing the underlying visualization.
- Tailwind extends the default palette with a domain palette under `lumify.{blue,amber,neutral}` (`tailwind.config.ts`).

**Path alias.** `@/` → `src/` (configured in `tsconfig.json` and `components.json`). Use it.

## Conventions

- **TypeScript is intentionally loose** (`strict: false`, `noImplicitAny: false`, `strictNullChecks: false`, `noUnusedLocals/Parameters: false`). Existing code relies on this — don't tighten globally.
- **ESLint disables `@typescript-eslint/no-unused-vars` and `no-explicit-any`** and only warns on react-hooks rules. `npm run lint` + `npm run typecheck` are the gates.
- Server-only modules start with `import "server-only"`; server actions start with `"use server"`; client components start with `"use client"`. Adding a server-only file without the marker risks leaking it into a client bundle.
- After any change to `src/server/db/schema.ts` or `src/server/domain/constants.ts`, run `npm run db:generate` to update `src/server/db/migrations/`.
- Server actions return `ActionResult<T>`; client components branch on `ok`. Don't throw across the action boundary unless you really want a Next.js error page.

## Known gotchas

- `getCurrentLightSettings` assumes the schedule is sorted ascending by `time` and includes points covering the queried hour. `generateCustomSchedule` returns sorted/deduped output with endpoints at `time: 0` and `time: 24` — preserve that invariant if you build schedules elsewhere.
- `fetchSunTimes` (client) returns `null` on error; `fetchSunTimesForLocation` (server) throws. Match the caller's expectation.
- `(app)/layout.tsx` calls `auth.protect()` even though `proxy.ts` already protects those paths — intentional belt-and-suspenders. Don't remove either.
- The README and the Lovable project ID in it describe the old Vite SPA. Don't follow its setup steps.

<!-- Beads / agent-profile / session-completion sections below are maintained intentionally;
     update via the bd setup tooling rather than hand-editing. -->

## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
