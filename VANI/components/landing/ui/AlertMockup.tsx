'use client'

export default function AlertMockup() {
  return (
    <div className="w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111111] overflow-hidden">
      {/* Red accent border */}
      <div className="h-1 w-full bg-[#EF4444]" />

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
            <span className="text-[10px] font-mono text-[#EF4444] font-semibold">CRITICAL ALERT</span>
          </div>
          <span className="text-[9px] font-mono text-[#444444]">Just now</span>
        </div>

        <div className="mb-4">
          <h4 className="text-base font-semibold text-white mb-1">Respiratory Distress Detected</h4>
          <p className="text-sm text-[#8B8B8B]">Patient showing signs of severe breathing difficulty during consultation.</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-[10px] font-medium text-white bg-[#EF4444] px-2 py-1 rounded">EMERGENCY</span>
          <span className="text-[10px] font-medium text-white bg-[#3B82F6] px-2 py-1 rounded">DOCTOR</span>
          <span className="text-[10px] font-medium text-white bg-[#0EA5E9] px-2 py-1 rounded">PATIENT</span>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex-1 bg-white text-black text-sm font-medium py-2 px-4 rounded-lg hover:bg-[#f5f5f5] transition-colors">
            Acknowledge Alert
          </button>
          <button className="text-sm font-medium text-[#8B8B8B] hover:text-white transition-colors">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
