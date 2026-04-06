export function SkeletonCard() {
  return (
    <div className="bg-[#0a0a0a] border border-[rgba(51,65,85,0.4)] rounded-2xl p-5 animate-pulse">
      {/* Top row - avatar and name */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-[#1a1a1a]" />
        <div className="flex-1">
          <div className="h-5 w-32 bg-[#1a1a1a] rounded mb-2" />
          <div className="h-3 w-20 bg-[#1a1a1a] rounded" />
        </div>
      </div>

      {/* Middle row - info items */}
      <div className="flex gap-4 mb-4">
        <div className="h-4 w-24 bg-[#1a1a1a] rounded" />
        <div className="h-4 w-20 bg-[#1a1a1a] rounded" />
        <div className="h-4 w-16 bg-[#1a1a1a] rounded" />
      </div>

      {/* Divider */}
      <div className="h-px bg-[#1a1a1a] mb-4" />

      {/* Bottom row - conditions and date */}
      <div className="flex justify-between items-center">
        <div className="h-6 w-24 bg-[#1a1a1a] rounded-full" />
        <div className="h-3 w-20 bg-[#1a1a1a] rounded" />
      </div>
    </div>
  );
}
