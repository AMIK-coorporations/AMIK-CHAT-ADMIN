import { NavLink, useLocation } from 'react-router-dom'
import {
    Activity, Users, MessageSquare, UserPlus, Phone,
    PlayCircle, BarChart3, Settings, Wifi, WifiOff
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
    { path: '/', label: 'Dashboard', icon: Activity },
    { path: '/users', label: 'Users', icon: Users },
    { path: '/chats', label: 'Chats', icon: MessageSquare },
    { path: '/messages', label: 'Messages', icon: MessageSquare },
    { path: '/user-contacts', label: 'User Contacts', icon: UserPlus },
    { path: '/contact-requests', label: 'Contact Requests', icon: UserPlus },
    { path: '/calls', label: 'Calls', icon: Phone },
    { path: '/call-signals', label: 'Call Signals', icon: Activity },
    { path: '/query-builder', label: 'Query Builder', icon: PlayCircle },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ isOpen, onClose }) {
    const [connected] = useState(true)

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
            )}

            <aside className={`fixed top-0 left-0 h-full w-64 bg-brand-card border-r border-brand-border z-50 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                {/* Logo Area */}
                <div className="p-6 border-b border-brand-border">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="AMIK CHAT" className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                            <h1 className="text-lg font-bold gradient-text">AMIK CHAT</h1>
                            <p className="text-xs text-brand-muted">Database Manager</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3">
                    <div className="space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-brand-cyan border border-brand-cyan/30 shadow-cyan'
                                        : 'text-brand-muted hover:bg-brand-border/50 hover:text-brand-text'
                                    }`
                                }
                                end={item.path === '/'}
                            >
                                <item.icon size={18} />
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                </nav>

                {/* Connection Status Footer */}
                <div className="p-4 border-t border-brand-border">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 pulse-dot' : 'bg-red-500'}`} />
                        <div className="flex items-center gap-1.5">
                            {connected ? <Wifi size={14} className="text-green-500" /> : <WifiOff size={14} className="text-red-500" />}
                            <span className="text-xs text-brand-muted">
                                {connected ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>
                    </div>
                    <p className="text-[10px] text-brand-muted mt-1">Last sync: just now</p>
                </div>
            </aside>
        </>
    )
}
