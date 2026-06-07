import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowUpRight, Sun, LineChart, BookOpenCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EarthlightWordmark, EarthlightMark } from "@/components/brand/EarthlightLogo";

/**
 * Editorial pillars surfaced under the hero. Mirrors the live-site framing:
 * scope protection, financial-language ROI, and standards-grounded modeling.
 */
const pillars = [
  {
    icon: Sun,
    eyebrow: "Schedule",
    title: "Schedules grounded in circadian science",
    body: "Generate intensity + CCT curves from WELL, IES TM-30, and CIRCA-aware occupant rhythms — not vibes.",
  },
  {
    icon: LineChart,
    eyebrow: "Human ROI",
    title: "Quantify what value engineering really costs",
    body: "Translate lighting decisions into financial language before they're stripped from the project.",
  },
  {
    icon: BookOpenCheck,
    eyebrow: "Defensible",
    title: "Snapshots your client can audit",
    body: "Every scenario and ROI version is timestamped and exportable — no spreadsheet detective work later.",
  },
];

export default async function LandingPage() {
  const { isAuthenticated } = await auth();
  if (isAuthenticated) redirect("/projects");

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-background text-foreground grain">
      {/* Layered atmosphere: paper grid + sun mesh + a single rising sun-disc
          in the upper-right that anchors the brand mark visually. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-paper opacity-[0.5]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-sun-mesh" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-sun-gradient opacity-25 blur-3xl"
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="relative z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <EarthlightWordmark markSize={32} className="text-[1.05rem]" />
          <nav className="flex items-center gap-2 text-sm">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild className="bg-earthlight-ink text-primary-foreground hover:bg-earthlight-ink-soft">
              <Link href="/sign-up">
                Book a 20-Minute ROI Review
                <ArrowUpRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-10 md:pt-20">
        <div className="grid items-end gap-12 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          {/* Headline column */}
          <div className="animate-rise">
            <p className="mb-6 flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-earthlight-slate">
              <span className="h-px w-8 bg-earthlight-slate/60" />
              Human-ROI for lighting design
            </p>
            <h1 className="font-display text-[clamp(2.5rem,6vw,4.75rem)] font-medium leading-[1.02] tracking-tight text-earthlight-ink">
              Saving lighting <span className="italic text-earthlight-ink-soft">from</span>
              <br />
              <em className="not-italic text-sun-gradient">misguided value engineering</em>
              <span className="inline-block w-2 -translate-y-1 align-middle text-earthlight-sun">.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-earthlight-slate">
              Earthlight embeds Human-ROI modeling into your lighting workflow. Protect scope, reduce
              value-engineering losses, and align capital decisions with long-term operational performance.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                asChild
                className="h-12 bg-earthlight-ink px-7 text-primary-foreground hover:bg-earthlight-ink-soft"
              >
                <Link href="/sign-up">
                  Book a 20-Minute Human-ROI Review
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                asChild
                className="h-12 text-earthlight-ink hover:bg-earthlight-paper-deep/60"
              >
                <Link href="/sign-in">
                  I already have an account
                  <ArrowUpRight className="ml-1.5 h-4 w-4 opacity-70" />
                </Link>
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-4 text-sm text-earthlight-slate">
              <div className="flex -space-x-2">
                <span className="h-7 w-7 rounded-full border-2 border-background bg-earthlight-paper-deep" />
                <span className="h-7 w-7 rounded-full border-2 border-background bg-earthlight-ink" />
                <span className="h-7 w-7 rounded-full border-2 border-background bg-sun-gradient" />
              </div>
              <span>
                Built with architects and lighting designers at firms shipping{" "}
                <span className="font-medium text-earthlight-ink">multi-tenant healthcare</span> and{" "}
                <span className="font-medium text-earthlight-ink">workplace</span> projects.
              </span>
            </div>
          </div>

          {/* Visual column — a circadian-schedule "specimen card" that hints at
              what's behind the auth wall without showing real client data. */}
          <ScheduleSpecimen />
        </div>
      </section>

      {/* ── Hairline divider with sun gradient — echoes the brand mark ──────── */}
      <div aria-hidden className="relative z-10 mx-auto h-px max-w-6xl bg-earthlight-hairline" />
      <div aria-hidden className="relative z-10 mx-auto -mt-px h-px max-w-6xl border-sun-hairline" />

      {/* ── Pillars ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between gap-6">
          <h2 className="font-display text-3xl font-medium tracking-tight text-earthlight-ink md:text-4xl">
            What gets built into your workflow
          </h2>
          <p className="hidden max-w-xs text-sm text-earthlight-slate md:block">
            Three primitives — schedules, ROI, and snapshots — that survive contract redlines.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-earthlight-hairline bg-earthlight-hairline md:grid-cols-3">
          {pillars.map((p) => (
            <article
              key={p.title}
              className="group relative flex flex-col gap-4 bg-card p-7 transition-colors hover:bg-earthlight-paper-soft"
            >
              <div className="flex items-center justify-between">
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-earthlight-slate">
                  {p.eyebrow}
                </p>
                <p.icon className="h-5 w-5 text-earthlight-sun" />
              </div>
              <h3 className="font-display text-xl font-medium leading-snug text-earthlight-ink">
                {p.title}
              </h3>
              <p className="text-sm leading-relaxed text-earthlight-slate">{p.body}</p>
              <span
                aria-hidden
                className="absolute inset-x-7 bottom-0 h-px origin-left scale-x-0 bg-sun-gradient transition-transform duration-500 group-hover:scale-x-100"
              />
            </article>
          ))}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 mx-auto max-w-6xl px-6 pb-12">
        <div className="flex flex-col items-start justify-between gap-4 border-t border-earthlight-hairline pt-8 text-sm text-earthlight-slate md:flex-row md:items-center">
          <EarthlightWordmark markSize={24} className="text-[0.95rem]" />
          <p>© {new Date().getFullYear()} Earthlight · Human-ROI for the built environment</p>
        </div>
      </footer>
    </main>
  );
}

/**
 * Small visual specimen rendered next to the headline. Purely decorative —
 * the real schedule visualizer lives behind auth at /projects/[id]. We hand-
 * rolled this rather than reusing the heavy visualizer so the landing page
 * stays a single tree of cheap, server-rendered DOM.
 */
function ScheduleSpecimen() {
  const ticks = ["6", "9", "12", "15", "18", "21"];
  // Sample intensity curve (illustrative only).
  const curve = [12, 22, 48, 78, 92, 86, 64, 38, 18, 10, 8, 6];

  return (
    <div className="relative animate-rise">
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[2rem] bg-earthlight-paper-soft shadow-[0_30px_80px_-40px_hsl(var(--el-ink)/0.35)]"
      />
      <div className="relative overflow-hidden rounded-2xl border border-earthlight-hairline bg-card p-6">
        {/* Card header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EarthlightMark size={20} />
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-earthlight-slate">
              Specimen · S-3 Workplace
            </p>
          </div>
          <p className="font-mono text-[0.7rem] text-earthlight-slate">v 1.04</p>
        </div>

        {/* Sun-rise diagram — concentric arcs over a horizon line */}
        <div className="relative mb-5 flex h-32 items-end justify-center overflow-hidden rounded-xl bg-earthlight-paper-deep">
          <div
            aria-hidden
            className="absolute left-1/2 top-10 h-44 w-44 -translate-x-1/2 rounded-full bg-sun-gradient opacity-90 blur-[1px]"
          />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-earthlight-ink/30" />
          <div aria-hidden className="absolute inset-x-0 bottom-3 h-px bg-earthlight-ink/15" />
          <div aria-hidden className="absolute inset-x-0 bottom-6 h-px bg-earthlight-ink/10" />
        </div>

        {/* Intensity bars (CSS-only — no chart lib in landing bundle) */}
        <div className="mb-3 flex h-24 items-end gap-1.5">
          {curve.map((v, i) => (
            <span
              key={i}
              style={{ height: `${v}%` }}
              className="flex-1 rounded-sm bg-gradient-to-t from-earthlight-ink/85 via-earthlight-sun-orange/70 to-earthlight-sun-amber transition-all"
            />
          ))}
        </div>
        <div className="flex justify-between text-[0.65rem] font-mono text-earthlight-slate">
          {ticks.map((t) => (
            <span key={t}>{t}:00</span>
          ))}
        </div>

        {/* Stat row */}
        <div className="mt-5 grid grid-cols-3 gap-4 border-t border-earthlight-hairline pt-4 text-xs">
          <Stat label="Peak intensity" value="92%" />
          <Stat label="Peak CCT" value="5200K" />
          <Stat label="ΔROI vs base" value="+ $148K" tone="sun" />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "ink",
}: {
  label: string;
  value: string;
  tone?: "ink" | "sun";
}) {
  return (
    <div>
      <p className="mb-1 text-[0.65rem] uppercase tracking-[0.18em] text-earthlight-slate">{label}</p>
      <p
        className={
          tone === "sun"
            ? "font-display text-lg font-semibold text-sun-gradient"
            : "font-display text-lg font-semibold text-earthlight-ink"
        }
      >
        {value}
      </p>
    </div>
  );
}
