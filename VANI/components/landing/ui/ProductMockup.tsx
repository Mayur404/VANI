'use client'

export default function ProductMockup() {
  return (
    <div className="w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111111] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span className="text-xs font-mono text-[#8B8B8B]">LIVE SESSION</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#444444]">ID: VN-2025-0847</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-px bg-[rgba(255,255,255,0.08)]">
        {/* Left Panel - Transcript */}
        <div className="col-span-4 bg-[#0A0A0A] p-4">
          <div className="text-xs font-mono text-[#444444] mb-3 uppercase tracking-wider">Transcript</div>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-[#3B82F6] bg-[rgba(59,130,246,0.1)] px-1.5 py-0.5 rounded">DR</span>
              <div>
                <p className="text-xs text-[#8B8B8B] leading-relaxed">
                  <span className="text-white">नमस्ते रामू,</span>
                  <span className="text-[#8B8B8B]"> how are you feeling today?</span>
                </p>
                <span className="text-[9px] font-mono text-[#444444]">KN · EN</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-[#0EA5E9] bg-[rgba(14,165,233,0.1)] px-1.5 py-0.5 rounded">PT</span>
              <div>
                <p className="text-xs text-[#8B8B8B] leading-relaxed">
                  <span className="text-white">डॉक्टर साहब,</span>
                  <span className="text-[#8B8B8B]"> I have chest pressure for 4 days.</span>
                </p>
                <span className="text-[9px] font-mono text-[#444444]">HI · EN</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-[#3B82F6] bg-[rgba(59,130,246,0.1)] px-1.5 py-0.5 rounded">DR</span>
              <div>
                <p className="text-xs text-[#8B8B8B] leading-relaxed">
                  <span className="text-white">Any fever or cough?</span>
                </p>
                <span className="text-[9px] font-mono text-[#444444]">EN</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel - Waveform */}
        <div className="col-span-5 bg-[#0A0A0A] p-4">
          <div className="text-xs font-mono text-[#444444] mb-3 uppercase tracking-wider">Audio</div>
          <div className="flex items-center justify-center h-32 gap-1">
            {[...Array(24)].map((_, i) => (
              <div
                key={i}
                className="w-1.5 bg-[#10B981] rounded-full"
                style={{
                  height: `${20 + Math.sin(i * 0.5) * 15 + Math.random() * 20}%`,
                  opacity: 0.6 + Math.random() * 0.4,
                }}
              />
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[10px] font-mono text-[#10B981]">RECORDING</span>
          </div>
        </div>

        {/* Right Panel - Extractions */}
        <div className="col-span-3 bg-[#0A0A0A] p-4">
          <div className="text-xs font-mono text-[#444444] mb-3 uppercase tracking-wider">Extracted</div>
          <div className="space-y-2">
            <div className="p-2 bg-[#111111] rounded border border-[rgba(255,255,255,0.06)]">
              <div className="text-[9px] font-mono text-[#444444] mb-0.5">CHIEF COMPLAINT</div>
              <div className="text-xs text-white">Chest pressure</div>
            </div>
            <div className="p-2 bg-[#111111] rounded border border-[rgba(255,255,255,0.06)]">
              <div className="text-[9px] font-mono text-[#444444] mb-0.5">DURATION</div>
              <div className="text-xs text-white">4 days</div>
            </div>
            <div className="p-2 bg-[#111111] rounded border border-[rgba(255,255,255,0.06)]">
              <div className="text-[9px] font-mono text-[#444444] mb-0.5">SYMPTOMS</div>
              <div className="text-xs text-white">Fever, cough</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
