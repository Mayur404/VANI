'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { InputGroupDemo } from './Searchbar'
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'

type AlertSummary = {
    critical: number;
    medium: number;
    low: number;
    acknowledged: number;
    totalOpen: number;
}

const Navbar = () => {
    const { isLoaded, isSignedIn } = useUser()
    const [alertCounts, setAlertCounts] = useState<AlertSummary>({
        critical: 0,
        medium: 0,
        low: 0,
        acknowledged: 0,
        totalOpen: 0,
    })

    useEffect(() => {
        let isMounted = true

        const fetchAlertSummary = async () => {
            try {
                const response = await fetch('/api/alerts/summary', { cache: 'no-store' })
                const contentType = response.headers.get('content-type') || ''

                if (!response.ok || !contentType.includes('application/json')) {
                    return
                }

                const data = await response.json()
                if (isMounted) {
                    setAlertCounts({
                        critical: Number(data.critical || 0),
                        medium: Number(data.medium || 0),
                        low: Number(data.low || 0),
                        acknowledged: Number(data.acknowledged || 0),
                        totalOpen: Number(data.totalOpen || 0),
                    })
                }
            } catch (error) {
                console.error('Failed to fetch alert summary:', error)
            }
        }

        void fetchAlertSummary()
        const intervalId = window.setInterval(() => {
            void fetchAlertSummary()
        }, 30000)

        return () => {
            isMounted = false
            window.clearInterval(intervalId)
        }
    }, [])

    const hasOpenAlerts = alertCounts.totalOpen > 0

    return (
        <div>
            <nav className='h-16 w-full flex items-center justify-center'>
                <div className='w-full h-full p-3'>
                    {/* <div className='w-1/2 h-full rounded-2xl flex items-center bg-[#080708] border border-[#19171a]'>
                        <Search size={18} className='text-white m-4' />
                        <h3 className='font-medium text-gray-500'>search or press ctrl + k</h3>
                    </div> */}
                    <InputGroupDemo />
                </div>
                <div className='w-full h-full flex items-center justify-end'>
                    <Link
                        href="/alerts"
                        className={`relative mx-4 flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 ${
                            hasOpenAlerts
                                ? 'border-red-500/50 bg-red-500/10 shadow-[0_0_16px_rgba(239,68,68,0.2)]'
                                : 'border-[#2c2c2c] bg-transparent hover:bg-[#141414]'
                        }`}
                    >
                        <Bell
                            size={18}
                            className={`text-white ${hasOpenAlerts ? 'animate-pulse' : ''}`}
                        />
                        {hasOpenAlerts ? (
                            <>
                                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                                    {alertCounts.totalOpen > 99 ? '99+' : alertCounts.totalOpen}
                                </span>
                                <span className="absolute -right-1 -top-1 h-5 w-5 animate-ping rounded-full bg-red-500/60" />
                            </>
                        ) : null}
                    </Link>
                    {isLoaded && !isSignedIn ? (
                        <div className="mx-4 flex items-center gap-3">
                            <SignInButton>
                                <button className="text-sm text-[#8B8B8B] hover:text-white transition-colors duration-200">
                                    Log in
                                </button>
                            </SignInButton>
                            <SignUpButton>
                                <button className="text-sm font-medium bg-white text-[#0A0A0A] px-4 py-1.5 rounded-full hover:scale-[1.02] transition-transform duration-200">
                                    Sign up
                                </button>
                            </SignUpButton>
                        </div>
                    ) : null}
                    {isLoaded && isSignedIn ? (
                        <div className="mx-4">
                            <UserButton afterSignOutUrl="/" />
                        </div>
                    ) : null}
                </div>
            </nav>
        </div>
    )
}

export default Navbar
