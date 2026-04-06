'use client'

interface IsometricIllustrationProps {
  type: 'layers' | 'nodes' | 'speed'
}

export default function IsometricIllustration({ type }: IsometricIllustrationProps) {
  const strokeColor = 'rgba(255,255,255,0.15)'

  if (type === 'layers') {
    return (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 8L56 20L32 32L8 20L32 8Z" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M8 20V44L32 56V32" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M56 20V44L32 56V32" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M32 20V44" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M8 28L32 40L56 28" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M8 36L32 48L56 36" stroke={strokeColor} strokeWidth="1.5" />
      </svg>
    )
  }

  if (type === 'nodes') {
    return (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="6" stroke={strokeColor} strokeWidth="1.5" />
        <circle cx="16" cy="16" r="4" stroke={strokeColor} strokeWidth="1.5" />
        <circle cx="48" cy="16" r="4" stroke={strokeColor} strokeWidth="1.5" />
        <circle cx="16" cy="48" r="4" stroke={strokeColor} strokeWidth="1.5" />
        <circle cx="48" cy="48" r="4" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M32 26V20" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M20 20L26 26" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M44 20L38 26" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M20 44L26 38" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M44 44L38 38" stroke={strokeColor} strokeWidth="1.5" />
      </svg>
    )
  }

  if (type === 'speed') {
    return (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 48L20 16" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M24 48L32 16" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M36 48L44 16" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M48 48L56 16" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M12 56L18 32" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M24 56L30 32" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M36 56L42 32" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M48 56L54 32" stroke={strokeColor} strokeWidth="1.5" />
      </svg>
    )
  }

  return null
}
