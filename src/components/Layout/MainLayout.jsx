import { useState } from 'react'
import Sidebar from './Sidebar'
import { Menu } from 'lucide-react'

export default function MainLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-brand-bg">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Mobile header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-brand-card border-b border-brand-border z-30 flex items-center px-4">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 rounded-lg hover:bg-brand-border/50 transition-colors"
                >
                    <Menu size={20} className="text-brand-text" />
                </button>
                <img src="/logo.png" alt="AMIK CHAT" className="ml-3 w-8 h-8 object-contain" />
                <span className="ml-2 font-semibold gradient-text">AMIK CHAT DB</span>
            </div>

            {/* Main content */}
            <main className="lg:ml-64 min-h-screen pt-14 lg:pt-0">
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    )
}
