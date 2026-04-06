import { Activity, BellRing, CalendarClock, FileText, Mic, ShieldAlert, Stethoscope, Wallet } from 'lucide-react'

function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-zinc-500">
      {children}
    </div>
  )
}

export function ProductPreview() {
  const bars = [44, 72, 58, 86, 60, 48, 78, 66, 54, 80, 62, 46, 74, 64, 56, 82]

  return (
    <div className="overflow-hidden rounded-[32px] border border-white/10 bg-zinc-950 shadow-[0_24px_120px_rgba(0,0,0,0.55)]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
            <Mic size={18} />
          </div>
          <div>
            <p className="font-outfit text-sm font-semibold text-white">Live cabin session</p>
            <p className="font-mono text-[11px] text-zinc-500">Session VN-2048 / realtime + final pass</p>
          </div>
        </div>
        <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] text-emerald-300">
          recording
        </div>
      </div>

      <div className="grid gap-px bg-white/10 lg:grid-cols-[1.15fr_0.9fr_1fr]">
        <div className="bg-zinc-950 p-5">
          <PanelLabel>
            <FileText size={12} />
            Transcript
          </PanelLabel>
          <div className="space-y-4">
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-sky-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-sky-300">
                  Doctor
                </span>
                <span className="font-mono text-[10px] text-zinc-500">00:12</span>
              </div>
              <p className="font-lexend text-sm leading-6 text-zinc-200">
                Tell me when the chest tightness started and whether it gets worse while walking.
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-cyan-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-300">
                  Patient
                </span>
                <span className="font-mono text-[10px] text-zinc-500">00:19</span>
              </div>
              <p className="font-lexend text-sm leading-6 text-zinc-200">
                It started four days ago. I also feel short of breath after climbing stairs.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {['kn', 'hi', 'en'].map((language) => (
                <div
                  key={language}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400"
                >
                  {language}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-zinc-950 p-5">
          <PanelLabel>
            <Activity size={12} />
            Audio pulse
          </PanelLabel>
          <div className="flex h-[210px] items-end justify-center gap-2 rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.15),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-5 pb-8 pt-12">
            {bars.map((height, index) => (
              <div
                key={index}
                className="w-2 rounded-full bg-gradient-to-t from-emerald-600 via-emerald-400 to-emerald-200"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">Input</p>
              <p className="mt-2 font-outfit text-sm text-white">Live mic capture</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">Final pass</p>
              <p className="mt-2 font-outfit text-sm text-white">Sarvam transcription</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-950 p-5">
          <PanelLabel>
            <Stethoscope size={12} />
            Structured report
          </PanelLabel>
          <div className="space-y-3">
            {[
              ['Chief complaint', 'Chest tightness and exertional breathlessness'],
              ['Symptoms', 'Chest pressure, fatigue, breathlessness'],
              ['Duration', '4 days'],
              ['Plan', 'Clinical review, ECG, symptom monitoring'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">{label}</p>
                <p className="mt-2 font-lexend text-sm leading-6 text-zinc-100">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function TranscriptPreview() {
  return (
    <div className="rounded-[28px] border border-white/10 bg-zinc-950 p-5 shadow-[0_18px_64px_rgba(0,0,0,0.45)]">
      <PanelLabel>
        <FileText size={12} />
        Live transcription
      </PanelLabel>
      <div className="space-y-4">
        {[
          {
            speaker: 'Doctor',
            tone: 'sky',
            text: 'Walk me through your pain pattern. Does it stay in the center or move to the arm?',
            stamp: '00:12',
          },
          {
            speaker: 'Patient',
            tone: 'cyan',
            text: 'Mostly in the center. It becomes sharper whenever I climb the stairs.',
            stamp: '00:19',
          },
          {
            speaker: 'Doctor',
            tone: 'sky',
            text: 'Noted. I am also marking shortness of breath and reduced activity tolerance.',
            stamp: '00:28',
          },
        ].map((item) => (
          <div
            key={`${item.speaker}-${item.stamp}`}
            className={`rounded-2xl border p-4 ${
              item.tone === 'sky'
                ? 'border-sky-500/20 bg-sky-500/5'
                : 'border-cyan-500/20 bg-cyan-500/5'
            }`}
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                  item.tone === 'sky' ? 'bg-sky-500/15 text-sky-300' : 'bg-cyan-500/15 text-cyan-300'
                }`}
              >
                {item.speaker}
              </span>
              <span className="font-mono text-[10px] text-zinc-500">{item.stamp}</span>
            </div>
            <p className="font-lexend text-sm leading-6 text-zinc-200">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ExtractionPreview() {
  return (
    <div className="rounded-[28px] border border-white/10 bg-zinc-950 p-5 shadow-[0_18px_64px_rgba(0,0,0,0.45)]">
      <PanelLabel>
        <Wallet size={12} />
        AI extraction
      </PanelLabel>
      <div className="space-y-3">
        {[
          ['Payment status', 'Partial payment confirmed'],
          ['Amount paid', 'Rs. 8,000'],
          ['Promise to pay', 'April 12, 2026'],
          ['Next action', 'Schedule reminder call at 09:30'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">{label}</p>
            <p className="mt-2 font-outfit text-sm text-white">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AlertPreview() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-rose-500/20 bg-zinc-950 shadow-[0_18px_64px_rgba(0,0,0,0.45)]">
      <div className="h-1 bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300" />
      <div className="p-5">
        <PanelLabel>
          <ShieldAlert size={12} />
          Alert routing
        </PanelLabel>
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-300">
              <BellRing size={16} />
              <span className="font-outfit text-sm font-semibold">Critical symptom detected</span>
            </div>
            <span className="font-mono text-[10px] text-zinc-500">under 2s</span>
          </div>
          <p className="font-lexend text-sm leading-6 text-zinc-200">
            Doctor, patient, and emergency contact receive the same alert trail with session context.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['doctor', 'patient', 'emergency contact'].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">Doctor action</p>
            <p className="mt-2 font-outfit text-sm text-white">Acknowledge and open session</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">Scheduling</p>
            <div className="mt-2 flex items-center gap-2 font-outfit text-sm text-white">
              <CalendarClock size={14} className="text-amber-300" />
              Follow-up automation armed
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
