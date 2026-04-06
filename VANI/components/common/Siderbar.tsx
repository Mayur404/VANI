'use client'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import SidebarProps from './SidebarProps'
import { SidebarItem } from './SidebarProps'
import {
    MessageSquareWarning,
    CirclePlus,
    History,
    Users,
    Calendar,
    LayoutDashboard,
    Mic,
    Upload,
    X
} from "lucide-react";

const Sidebar = () => {
    const pathname = usePathname()
    const router = useRouter()
    const [isNewSessionOpen, setIsNewSessionOpen] = useState(false)

    const openNewSession = () => setIsNewSessionOpen(true)
    const closeNewSession = () => setIsNewSessionOpen(false)

    const handleRecordNow = () => {
        closeNewSession()
        router.push('/voice')
    }

    const handleUploadRecording = () => {
        closeNewSession()
        router.push('/sessions')
    }

    return (
        <>
            <SidebarProps>
                <SidebarItem
                    icon={<LayoutDashboard size={20} />}
                    text="Dashboard"
                    href="/dashboard"
                    active={pathname.startsWith('/dashboard')}
                />
                <SidebarItem
                    icon={<CirclePlus size={20} />}
                    text="New Session"
                    onClick={openNewSession}
                    active={isNewSessionOpen}
                />
                <SidebarItem
                    icon={<History size={20} />}
                    text="Sessions"
                    active={false}
                />
                <SidebarItem
                    icon={<Users size={20} />}
                    text="Patients/Customers"
                    href="/sessions"
                    active={pathname.startsWith('/sessions')}
                />
                <SidebarItem
                    icon={<Calendar size={20} />}
                    text="Schedule Calls"
                    href="/callscheduling"
                    active={pathname.startsWith('/callscheduling')}
                />
                <SidebarItem
                    icon={<MessageSquareWarning size={20} />}
                    text="Alerts"
                    href="/alerts"
                    active={pathname.startsWith('/alerts')}
                />
            </SidebarProps>

            {isNewSessionOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="relative w-[92%] max-w-xl rounded-2xl border border-[#1f1f1f] bg-[#0f0e10] p-8">
                        <button
                            type="button"
                            onClick={closeNewSession}
                            className="absolute right-4 top-4 text-[#9d9d9d] transition-colors hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-6">
                            <h2 className="font-oxanium text-2xl font-bold text-white">Start a New Session</h2>
                            <p className="mt-2 text-sm text-[#9d9d9d]">
                                Choose how you want to begin this session.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <button
                                type="button"
                                onClick={handleRecordNow}
                                className="rounded-2xl border border-[rgba(59,130,246,0.35)] bg-[rgba(59,130,246,0.08)] p-5 text-left transition-all duration-200 hover:border-[rgba(59,130,246,0.7)] hover:bg-[rgba(59,130,246,0.14)]"
                            >
                                <Mic size={28} className="mb-3 text-[#60a5fa]" />
                                <h3 className="font-oxanium text-lg font-bold text-white">Record Now</h3>
                                <p className="mt-2 text-sm text-[#b7b7b7]">
                                    Start a live recording session with the existing voice workflow.
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={handleUploadRecording}
                                className="rounded-2xl border border-[rgba(139,92,246,0.35)] bg-[rgba(139,92,246,0.08)] p-5 text-left transition-all duration-200 hover:border-[rgba(139,92,246,0.7)] hover:bg-[rgba(139,92,246,0.14)]"
                            >
                                <Upload size={28} className="mb-3 text-[#a78bfa]" />
                                <h3 className="font-oxanium text-lg font-bold text-white">Upload Recording</h3>
                                <p className="mt-2 text-sm text-[#b7b7b7]">
                                    Go to sessions and choose the patient or customer for an uploaded recording.
                                </p>
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    )
}

export default Sidebar
