import { MoreVertical, TextAlignJustify } from 'lucide-react'
import { createContext, useContext, useState } from 'react'
// import useSidebarStore from '../../store/store'
// import type { SidebarState } from '../../store/store'

const SidebarContext = createContext({ expanded: false });

const SidebarProps = ({ children }: any) => {
    // const expanded = useSidebarStore((state: SidebarState) => state.expanded)
    // const setExpanded = useSidebarStore((state: SidebarState) => state.setExpanded)
    const [expanded, setExpanded] = useState(false)

    return (
        <aside className={`h-screen ${expanded ? 'w-64' : 'w-16'} bg-[#1a1a1a]] rounded-2xl transition-all duration-300`}>
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
                    <img src='https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fimgcdn.stablediffusionweb.com%2F2024%2F4%2F17%2F6d71579f-ecef-42de-b83e-c0cb8179130c.jpg&f=1&nofb=1&ipt=633d3b558f950e62b027deb8cd63f66f95a2542d325ce496f44057b1273f2f36' alt='' className='w-10 h-10 rounded-full border-[#9a9faf] border-4' />
                    <div className={`flex justify-between items-center overflow-hidden transition-all ${expanded ? 'w-52 ml-3' : 'w-0'}`}>
                        <div className='leading-4'>
                            <h4 className='font-semibold text-white'>M Praneeth</h4>
                            <span className='text-xs text-white'>madasu.praneeth464@gmail.com</span>
                        </div>
                        <MoreVertical size={24} className='text-white' />
                    </div>
                </div>
            </nav>
        </aside>
    )
}

export function SidebarItem({ icon, text, active, alert }: any) {
    const { expanded } = useContext(SidebarContext)
    return (
        <li className={`relative flex items-center py-2 px-3 my-1 font-medium rounded-md cursor-pointer transition-colors text-white ${active ? 'bg-[#f1eef2] text-[#080708]' : 'hover:bg-[#19171a] text-white'}`}>
            {icon}
            <span className={`overflow-hidden transition-all ${expanded ? 'w-52 ml-3' : 'w-0'}`}>{text}</span>
            {alert && <div className={`absolute right-2 w-1.5 h-1.5 rounded bg-green-400 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] ${expanded ? '' : 'top-2'}`}></div>}
        </li>
    )
}

export default SidebarProps
