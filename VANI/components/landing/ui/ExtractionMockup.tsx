'use client'

export default function ExtractionMockup() {
  return (
    <div className="w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111111] p-4">
      <div className="text-xs font-mono text-[#444444] mb-4 uppercase tracking-wider">AI Extraction</div>
      <div className="space-y-3">
        <div className="p-3 bg-[#0A0A0A] rounded-lg border border-[rgba(255,255,255,0.06)]">
          <div className="text-[10px] font-mono text-[#444444] mb-1">CHIEF COMPLAINT</div>
          <div className="text-sm text-white">Chest pressure and difficulty breathing</div>
        </div>

        <div className="p-3 bg-[#0A0A0A] rounded-lg border border-[rgba(255,255,255,0.06)]">
          <div className="text-[10px] font-mono text-[#444444] mb-1">DURATION</div>
          <div className="text-sm text-white">4 days</div>
        </div>

        <div className="p-3 bg-[#0A0A0A] rounded-lg border border-[rgba(255,255,255,0.06)]">
          <div className="text-[10px] font-mono text-[#444444] mb-1">SYMPTOMS</div>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-white bg-[rgba(255,255,255,0.08)] px-2 py-0.5 rounded">Fever</span>
            <span className="text-xs text-white bg-[rgba(255,255,255,0.08)] px-2 py-0.5 rounded">Cough</span>
            <span className="text-xs text-white bg-[rgba(255,255,255,0.08)] px-2 py-0.5 rounded">Breathlessness</span>
          </div>
        </div>

        <div className="p-3 bg-[#0A0A0A] rounded-lg border border-[rgba(255,255,255,0.06)]">
          <div className="text-[10px] font-mono text-[#444444] mb-1">PRELIMINARY DIAGNOSIS</div>
          <div className="text-sm text-white">Viral Upper Respiratory Tract Infection</div>
        </div>

        <div className="p-3 bg-[#0A0A0A] rounded-lg border border-[rgba(255,255,255,0.06)]">
          <div className="text-[10px] font-mono text-[#444444] mb-1">RECOMMENDED ACTION</div>
          <div className="text-sm text-white">Clinical evaluation + Chest X-ray</div>
        </div>
      </div>
    </div>
  )
}
