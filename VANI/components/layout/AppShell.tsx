'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/common/Navbar'
import Sidebar from '@/components/common/Siderbar'

export default function AppShell({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const isPublicLanding =
    pathname === '/' ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/sso-callback')

  if (isPublicLanding) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen w-full flex-col">
        <Navbar />
        {children}
      </div>
    </div>
  )
}
