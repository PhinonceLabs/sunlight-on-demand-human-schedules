# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

"Earthlight" — a Vite + React + TypeScript single-page app that generates science-based circadian lighting schedules (intensity + color temperature over a 24-hour day) for architects and lighting professionals. The repo is a [Lovable](https://lovable.dev) project (project id `e9d549f3-abd2-4b0f-9a9d-b790b9886eb3`); changes pushed to the repo are reflected in Lovable and vice versa.

## Commands

```bash
npm i              # install
npm run dev        # vite dev server on port 8080, host "::"
npm run build      # production build
npm run build:dev  # build in development mode (keeps dev tooling)
npm run lint       # eslint over the repo (flat config in eslint.config.js)
npm run preview    # serve the built bundle
```

There is no test runner configured. There is no typecheck script — TS errors surface through `vite build` or the editor.

## Architecture

**Single-page app, no backend.** All state lives in the browser; the only network call is to `https://api.sunrise-sunset.org` (`fetchSunTimes` in `src/utils/scheduleGenerator.ts`).

**Routing.** `src/App.tsx` mounts a `BrowserRouter` with exactly two routes: `/` → `pages/Index.tsx`, `*` → `pages/NotFound.tsx`. The catch-all must stay last (commented in App.tsx).

**The whole UI is one page of tabs.** `pages/Index.tsx` is a `<Tabs>` with ~10 panels (Settings, Schedule, Visualizer, Projects, Export, Integrations, ROI, Compare, Research, Report), each rendering a single component from `src/components/`. The page holds three pieces of shared state and threads them into the panels:

- `currentScheduleIndex` — index into `standardSchedules`
- `customSchedule` — optional user-built schedule, wins over the preset when set
- `roiData` — populated by `ROICalculator`, consumed by `FinalReport`

`activeSchedule = customSchedule || standardSchedules[currentScheduleIndex]` is the value passed to every panel that needs the "currently displayed" schedule.

**Domain model — the two files that matter.**

- `src/utils/lightingStandards.ts` — types (`TimeIntensityPair`, `LightingSchedule`), the preset schedules (`standardSchedules`), and color-science helpers (`kelvinToHex`, `getColorTemperatureName`). Edit here when adding presets or changing the schedule shape.
- `src/utils/scheduleGenerator.ts` — pure functions that derive runtime values from a schedule: `generateCustomSchedule` (wake/sleep/sun-times → schedule), `getCurrentLightSettings` (linear interpolation between the two surrounding `TimeIntensityPair` points), `fetchSunTimes`, and time formatters.

A `LightingSchedule` is a name + description + sorted `TimeIntensityPair[]` (time in 0–24 decimal hours, intensity 0–100%, temperature in Kelvin) + citations. Schedules must include endpoints at `time: 0` and `time: 24`; `generateCustomSchedule` enforces this and de-duplicates by time before returning.

**UI layer — shadcn/ui on Tailwind.** `components.json` is configured for the shadcn CLI (`baseColor: slate`, CSS variables, no RSC). Primitives live in `src/components/ui/`; add new ones via the shadcn CLI rather than hand-rolling. Tailwind extends the default palette with a domain palette under `lumify.{blue,amber,neutral}` (see `tailwind.config.ts`).

**Path alias.** `@/` → `src/` (configured in `vite.config.ts`, `tsconfig.json`, and `components.json`). Use it in imports.

**Lovable dev tagger.** `vite.config.ts` injects `lovable-tagger` only in `mode === 'development'`. Do not remove it from the plugin chain — Lovable's web editor relies on the data attributes it adds.

## Conventions

- **TypeScript is intentionally loose.** `tsconfig.json` sets `noImplicitAny: false`, `strictNullChecks: false`, `noUnusedLocals: false`, `noUnusedParameters: false`. Don't tighten these globally without reason; existing code (e.g. `roiData: any` in `Index.tsx`) depends on the loose mode.
- **ESLint disables `@typescript-eslint/no-unused-vars`** and only warns on `react-refresh/only-export-components`. `npm run lint` is the gate.
- **shadcn primitives stay untouched.** Treat `src/components/ui/*` as generated; customize via props/className or by re-running the CLI, not by editing in place.
- **Pure utils in `src/utils/`, side-effecting / Tailwind-merging helpers in `src/lib/utils.ts`** (`cn()` lives there). Don't mix.

## Known shape gotchas

- `getCurrentLightSettings` assumes the schedule is sorted by `time` ascending and includes points covering the queried hour. `generateCustomSchedule` returns sorted/deduped output; preserve that invariant if you build schedules elsewhere.
- `fetchSunTimes` returns `null` on error rather than throwing — callers must null-check.
- The dev server binds to `host: "::"` and port `8080`, not Vite's default. Match that when configuring tunnels or reverse proxies.


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:6cd5cc61 -->
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
<!-- END BEADS INTEGRATION -->
