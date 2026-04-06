import Link from 'next/link'
import { MoreVertical, TextAlignJustify } from 'lucide-react'
import { ReactNode, createContext, useContext, useState } from 'react'
import { useUser } from '@clerk/nextjs'
// import useSidebarStore from '../../store/store'
// import type { SidebarState } from '../../store/store'

const SidebarContext = createContext({ expanded: false });

const SidebarProps = ({ children }: { children: ReactNode }) => {
    // const expanded = useSidebarStore((state: SidebarState) => state.expanded)
    // const setExpanded = useSidebarStore((state: SidebarState) => state.setExpanded)
    const [expanded, setExpanded] = useState(false)
    const { isLoaded, user } = useUser()

    const displayName =
        user?.fullName ||
        [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
        user?.username ||
        'Guest User'

    const primaryEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || 'Not signed in'
    const avatarUrl = user?.imageUrl || 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fimgcdn.stablediffusionweb.com%2F2024%2F4%2F17%2F6d71579f-ecef-42de-b83e-c0cb8179130c.jpg&f=1&nofb=1&ipt=633d3b558f950e62b027deb8cd63f66f95a2542d325ce496f44057b1273f2f36'

    return (
        <aside className={`h-screen ${expanded ? 'w-64' : 'w-16'} bg-[#1a1a1a] rounded-2xl transition-all duration-300`}>
            <nav className='h-full flex flex-col shadow-sm'>
                <div className='p-4 pb-2 flex justify-between items-center'>
                    <img src='https://logoblox.com/logos/logo4/light.svg' className={`overflow-hidden transition-all duration-300 ${expanded ? 'w-12' : 'w-0'}`} alt='logo' />
                    <button onClick={() => setExpanded(!expanded)} className='p-1.5 rounded-lg'>
                        <TextAlignJustify size={24} className='text-white cursor-pointer' />
                    </button>
                </div>
                <SidebarContext.Provider value={{ expanded }}>
                    <ul className='flex-1 px-3'>{children}</ul>
                </SidebarContext.Provider>
                <div className='flex p-3 '>
                    <img src={avatarUrl} alt={displayName} className='w-10 h-10 rounded-full border-[#9a9faf] border-4 object-cover' />
                    <div className={`flex justify-between items-center overflow-hidden transition-all ${expanded ? 'w-52 ml-3' : 'w-0'}`}>
                        <div className='leading-4'>
                            <h4 className='font-semibold text-white'>{isLoaded ? displayName : 'Loading...'}</h4>
                            <span className='text-xs text-white'>{isLoaded ? primaryEmail : ''}</span>
                        </div>
                        <MoreVertical size={24} className='text-white' />
                    </div>
                </div>
            </nav>
        </aside>
    )
}

type SidebarItemProps = {
    icon: ReactNode;
    text: string;
    active?: boolean;
    alert?: boolean;
    href?: string;
    onClick?: () => void;
};

export function SidebarItem({ icon, text, active, alert, href, onClick }: SidebarItemProps) {
    const { expanded } = useContext(SidebarContext)
    const className = `relative flex w-full items-center rounded-xl py-2 my-1 text-left font-medium transition-colors focus-visible:outline-none ${
        expanded ? 'justify-start gap-3 px-3' : 'justify-center px-0'
    } ${active ? 'border border-[#2c2c2c] bg-[#19171a] text-white' : 'border border-transparent bg-transparent text-[#d4d4d8] hover:bg-[#19171a] hover:text-white'}`

    const content = (
        <>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${active ? 'bg-[#222025]' : 'bg-transparent'}`}>
                {icon}
            </span>
            <span className={`overflow-hidden transition-all ${expanded ? 'w-52 ml-3' : 'w-0'}`}>{text}</span>
            {alert && <div className={`absolute right-2 w-1.5 h-1.5 rounded bg-green-400 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] ${expanded ? '' : 'top-2'}`}></div>}
        </>
    )

    return (
        <li>
            {href ? (
                <Link href={href} className={className} title={!expanded ? text : undefined}>
                    {content}
                </Link>
            ) : (
                <button type="button" onClick={onClick} className={`${className} appearance-none border-0 shadow-none`} title={!expanded ? text : undefined}>
                    {content}
                </button>
            )}
        </li>
    )
}

export default SidebarProps
