'use client'

export default function TranscriptMockup() {
  return (
    <div className="w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111111] p-4">
      <div className="text-xs font-mono text-[#444444] mb-4 uppercase tracking-wider">Live Transcription</div>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-[10px] font-semibold text-[#3B82F6] bg-[rgba(59,130,246,0.1)] px-2 py-1 rounded whitespace-nowrap">
            DOCTOR
          </span>
          <div className="flex-1">
            <p className="text-sm text-white leading-relaxed">
              <span className="text-white">ನಮಸ್ಕಾರ್ ರಾಮು,</span>
              <span className="text-[#8B8B8B]"> how are you feeling today? Tell me about your symptoms.</span>
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[9px] font-mono text-[#3B82F6]">KN</span>
              <span className="text-[9px] font-mono text-[#3B82F6]">EN</span>
              <span className="text-[9px] font-mono text-[#444444]">00:12</span>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-[10px] font-semibold text-[#0EA5E9] bg-[rgba(14,165,233,0.1)] px-2 py-1 rounded whitespace-nowrap">
            PATIENT
          </span>
          <div className="flex-1">
            <p className="text-sm text-white leading-relaxed">
              <span className="text-white">डॉक्टर साहब,</span>
              <span className="text-[#8B8B8B]"> I have been having chest pressure and difficulty breathing for the past 4 days.</span>
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[9px] font-mono text-[#0EA5E9]">HI</span>
              <span className="text-[9px] font-mono text-[#0EA5E9]">EN</span>
              <span className="text-[9px] font-mono text-[#444444]">00:18</span>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-[10px] font-semibold text-[#3B82F6] bg-[rgba(59,130,246,0.1)] px-2 py-1 rounded whitespace-nowrap">
            DOCTOR
          </span>
          <div className="flex-1">
            <p className="text-sm text-white leading-relaxed">
              <span className="text-white">Any fever, cough, or breathlessness?</span>
              <span className="text-[#8B8B8B]"> Have you taken any medication?</span>
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[9px] font-mono text-[#3B82F6]">EN</span>
              <span className="text-[9px] font-mono text-[#444444]">00:24</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
