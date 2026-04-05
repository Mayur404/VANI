'use client'
import SidebarProps from './SidebarProps'
import { SidebarItem } from './SidebarProps'
import {
    MessageSquareWarning,
    CirclePlus,
    History,
    Users,
    ChartPie,
    Calendar,
    LayoutDashboard,
    Settings
} from "lucide-react";
const Sidebar = () => {
    return (
        <SidebarProps>
            <SidebarItem icon={<LayoutDashboard size={20} />} text="Dashboard" alert />
            <SidebarItem icon={<CirclePlus size={20} />} text="New Session" />
            <SidebarItem icon={<History size={20} />} text="Sessions" />
            <SidebarItem icon={<Users size={20} />} text="Patients/Customers" />
            <SidebarItem icon={<ChartPie size={20} />} text="Analytics" />
            <SidebarItem icon={<Calendar size={20} />} text="Schedule Calls" />
            <SidebarItem icon={<MessageSquareWarning size={20} />} text="Alerts" />
            <SidebarItem icon={<Settings size={20} />} text="Settings" />
        </SidebarProps>
    )
}

export default Sidebar
