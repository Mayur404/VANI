import Link from 'next/link'
import { ArrowRight, CalendarClock, FileJson, HeartPulse, Languages, Mic, PhoneCall, ShieldCheck, Sparkles, Waves } from 'lucide-react'
import { AlertPreview, ExtractionPreview, ProductPreview, TranscriptPreview } from '@/components/landing/LandingMockups'

const workflowSteps = [
  {
    eyebrow: '1. Capture',
    title: 'Record live or trigger AI calls on schedule.',
    body:
      'Use one stack for doctor cabin recordings, manual finance calls, and auto-triggered AI recovery sessions.',
    points: ['Live session creation', 'Scheduled AI call automation', 'Manual and voice modes'],
    preview: <TranscriptPreview />,
  },
  {
    eyebrow: '2. Understand',
    title: 'Turn speech into transcripts and structured extraction.',
    body:
      'The same flow handles transcription, diarization, report extraction, and approval-ready summaries for healthcare and finance.',
    points: ['Realtime extraction', 'Final full-session transcript', 'Approval and save flow'],
    preview: <ExtractionPreview />,
  },
  {
    eyebrow: '3. Respond',
    title: 'Escalate risk and keep follow-ups moving.',
    body:
      'Critical cases surface immediately, while cumulative reports and JSON endpoints keep downstream systems aligned.',
    points: ['Critical alert routing', 'Cumulative reporting', 'Unified JSON access'],
    preview: <AlertPreview />,
  },
]

const domainCards = [
  {
    name: 'Healthcare',
    icon: HeartPulse,
    accent: 'from-sky-500/20 to-cyan-400/5',
    border: 'border-sky-400/20',
    copy:
      'Doctor cabin recording, final Sarvam transcription, live extraction, approval workflow, patient monitoring, and critical symptom alerts.',
    bullets: ['Voice recording sessions', 'Cumulative patient history', 'Monitoring programs', 'Emergency alert trail'],
  },
  {
    name: 'Finance',
    icon: PhoneCall,
    accent: 'from-amber-500/20 to-orange-400/5',
    border: 'border-amber-400/20',
    copy:
      'AI outbound calls, manual collection calls, scheduled callbacks, payment verification, and cumulative customer reports.',
    bullets: ['AI and manual call modes', 'Scheduled call triggers', 'Promise-to-pay tracking', 'JSON report exports'],
  },
]

const stats = [
  { value: '4', label: 'production flows unified across healthcare, finance, manual, and voice modes' },
  { value: '1', label: 'landing experience to enter the entire VANI system from a single public page' },
  { value: '0', label: 'extra portals required before recording, scheduling, or reviewing reports' },
]

function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[rgba(6,6,8,0.8)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white">
            <Waves size={18} />
          </div>
          <div>
            <p className="font-outfit text-sm font-semibold uppercase tracking-[0.28em] text-zinc-300">VANI</p>
            <p className="font-lexend text-xs text-zinc-500">Voice intelligence for ops-heavy teams</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-zinc-400 lg:flex">
          <a href="#features" className="transition hover:text-white">
            Features
          </a>
          <a href="#how-it-works" className="transition hover:text-white">
            How it works
          </a>
          <a href="#domains" className="transition hover:text-white">
            Domains
          </a>
          <a href="#launchpad" className="transition hover:text-white">
            Launchpad
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/voice"
            className="hidden rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.04] sm:inline-flex"
          >
            Live voice
          </Link>
          <Link
            href="/home"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:scale-[1.01]"
          >
            Open dashboard
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </header>
  )
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-zinc-500">
      {children}
    </p>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060608] text-white">
      <LandingNavbar />

      <main>
        <section className="relative overflow-hidden px-6 pb-24 pt-16 sm:pt-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-8%] top-[-8%] h-80 w-80 rounded-full bg-cyan-500/12 blur-3xl" />
            <div className="absolute right-[-12%] top-[8%] h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/8 px-4 py-2 text-sm text-emerald-200">
                <Sparkles size={14} />
                Reference-inspired public landing page for the VANI platform
              </div>
              <h1 className="font-oxanium text-5xl font-extrabold leading-[0.95] text-white sm:text-6xl xl:text-8xl">
                One voice workspace for
                <span className="block bg-gradient-to-r from-white via-cyan-200 to-amber-200 bg-clip-text text-transparent">
                  healthcare, finance, and live cabins.
                </span>
              </h1>
              <p className="mt-6 max-w-2xl font-lexend text-base leading-8 text-zinc-300 sm:text-lg">
                VANI records conversations, runs transcription, extracts structured reports, triggers scheduled AI
                calls, and keeps cumulative history in one system built for multilingual operations.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/voice"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.01]"
                >
                  Start a live voice session
                  <Mic size={16} />
                </Link>
                <Link
                  href="/callscheduling"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  View scheduled calls
                  <CalendarClock size={16} />
                </Link>
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-3">
                {[
                  ['Live extraction', 'Realtime transcript and report drafting while the conversation is still happening.'],
                  ['Final pass', 'Post-session Sarvam transcription to tighten the final record before approval.'],
                  ['JSON ready', 'GET and POST report access across finance AI, manual, healthcare, and voice flows.'],
                ].map(([title, copy]) => (
                  <div key={title} className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                    <p className="font-outfit text-sm font-semibold text-white">{title}</p>
                    <p className="mt-2 font-lexend text-sm leading-6 text-zinc-400">{copy}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:pb-6">
              <ProductPreview />
            </div>
          </div>
        </section>

        <section id="features" className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr]">
              <div>
                <SectionEyebrow>Built around actual workflow friction</SectionEyebrow>
                <h2 className="mt-4 font-oxanium text-4xl font-bold leading-tight text-white sm:text-5xl">
                  Move from conversation to action without switching systems.
                </h2>
              </div>
              <div className="grid gap-5 md:grid-cols-3">
                {[
                  {
                    icon: Languages,
                    title: 'Multilingual by default',
                    copy: 'Designed for mixed-language speech so teams can work naturally instead of scripting themselves.',
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Approval before save',
                    copy: 'Reports stay editable in the UI before being approved and persisted to the database and JSON outputs.',
                  },
                  {
                    icon: FileJson,
                    title: 'History that compounds',
                    copy: 'Finance and healthcare reports can accumulate across follow-ups so context does not reset every call.',
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-white">
                      <card.icon size={20} />
                    </div>
                    <h3 className="mt-5 font-outfit text-xl font-semibold text-white">{card.title}</h3>
                    <p className="mt-3 font-lexend text-sm leading-7 text-zinc-400">{card.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 max-w-3xl">
              <SectionEyebrow>How it works</SectionEyebrow>
              <h2 className="mt-4 font-oxanium text-4xl font-bold leading-tight text-white sm:text-5xl">
                A landing page that mirrors the platform you already built.
              </h2>
            </div>

            <div className="space-y-8">
              {workflowSteps.map((step, index) => (
                <div
                  key={step.eyebrow}
                  className={`grid gap-8 rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 lg:grid-cols-[0.82fr_1.18fr] lg:p-8 ${
                    index % 2 === 1 ? 'lg:grid-cols-[1.18fr_0.82fr]' : ''
                  }`}
                >
                  <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                    <SectionEyebrow>{step.eyebrow}</SectionEyebrow>
                    <h3 className="mt-4 font-oxanium text-3xl font-bold leading-tight text-white">{step.title}</h3>
                    <p className="mt-4 max-w-xl font-lexend text-sm leading-7 text-zinc-400">{step.body}</p>
                    <div className="mt-8 space-y-3">
                      {step.points.map((point) => (
                        <div key={point} className="flex items-center gap-3 text-sm text-zinc-200">
                          <span className="h-2 w-2 rounded-full bg-white/70" />
                          {point}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={index % 2 === 1 ? 'lg:order-1' : ''}>{step.preview}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="domains" className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <SectionEyebrow>Two domains, one operating layer</SectionEyebrow>
              <h2 className="mt-4 font-oxanium text-4xl font-bold text-white sm:text-6xl">
                Shared platform.
                <span className="block text-zinc-400">Different workflows.</span>
              </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {domainCards.map((domain) => (
                <div
                  key={domain.name}
                  className={`rounded-[32px] border ${domain.border} bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-8`}
                >
                  <div className={`inline-flex rounded-2xl bg-gradient-to-br ${domain.accent} p-3`}>
                    <domain.icon size={22} />
                  </div>
                  <h3 className="mt-6 font-outfit text-2xl font-semibold text-white">{domain.name}</h3>
                  <p className="mt-4 font-lexend text-sm leading-7 text-zinc-300">{domain.copy}</p>
                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {domain.bullets.map((bullet) => (
                      <div key={bullet} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200">
                        {bullet}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-7xl rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(34,197,94,0.08),rgba(255,255,255,0.02),rgba(245,158,11,0.08))] px-8 py-10">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <SectionEyebrow>Operational impact</SectionEyebrow>
                <h2 className="mt-4 font-oxanium text-4xl font-bold text-white sm:text-5xl">
                  Already shaped around the flows you asked for.
                </h2>
              </div>
              <div className="grid gap-5 md:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-[28px] border border-white/10 bg-black/25 p-5">
                    <p className="font-oxanium text-5xl font-extrabold text-white">{stat.value}</p>
                    <p className="mt-3 font-lexend text-sm leading-7 text-zinc-300">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="launchpad" className="px-6 pb-28 pt-12">
          <div className="mx-auto max-w-7xl rounded-[40px] border border-white/10 bg-white/[0.03] px-8 py-12 text-center">
            <SectionEyebrow>Launchpad</SectionEyebrow>
            <h2 className="mt-4 font-oxanium text-4xl font-bold text-white sm:text-6xl">
              Start with voice, scheduling, or the dashboard.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl font-lexend text-base leading-8 text-zinc-300">
              The landing page stays public and focused, but it hands users straight into the routes that already power
              VANI today.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/voice"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.01]"
              >
                Open voice console
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/callscheduling"
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-6 py-3 text-sm font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                Open scheduling
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-6 py-3 text-sm font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                Open dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/8 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-lexend">VANI combines recording, calls, extraction, approvals, and cumulative reporting.</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/home" className="transition hover:text-white">
              Dashboard
            </Link>
            <Link href="/voice" className="transition hover:text-white">
              Voice
            </Link>
            <Link href="/callscheduling" className="transition hover:text-white">
              Scheduling
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
