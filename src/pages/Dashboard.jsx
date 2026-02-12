import { useState, useMemo } from 'react'
import { useInsforge } from '../hooks/useInsforge'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import {
    Users, MessageSquare, Activity, UserPlus, Phone, Plus,
    BarChart3, PlayCircle, Download, Upload, RefreshCw, Wifi, Loader2
} from 'lucide-react'
import { formatRelativeTime } from '../utils/helpers'

function MetricCard({ title, value, icon: Icon, color, live, onClick }) {
    return (
        <div
            onClick={onClick}
            className="card cursor-pointer hover:scale-[1.02] hover:shadow-cyan-lg transition-all duration-200 group"
        >
            <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon size={22} className="text-white" />
                </div>
                {live && (
                    <span className="flex items-center gap-1.5 text-[10px] text-green-400 font-semibold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
                        Live
                    </span>
                )}
            </div>
            <p className="text-3xl font-bold text-brand-text mb-1">{value}</p>
            <p className="text-sm text-brand-muted">{title}</p>
        </div>
    )
}

export default function Dashboard() {
    const { users, chats, messages, contactRequests, userContacts, calls, callSignals, allLoading, refetchAll } = useInsforge()
    const navigate = useNavigate()
    const toast = useToast()

    const onlineUsers = users.data.filter((u) => u.is_online).length
    const pendingRequests = contactRequests.data.filter((r) => r.status === 'pending').length
    const activeCalls = calls.data.filter((c) => c.status === 'active').length

    const recentActivity = useMemo(() => {
        const activities = []
        messages.data.slice(0, 5).forEach((m) => {
            activities.push({ type: 'INSERT', table: 'messages', id: m.id, time: m.timestamp, desc: `Message from ${m.sender_id}` })
        })
        users.data.slice(0, 3).forEach((u) => {
            activities.push({ type: 'INSERT', table: 'users', id: u.id, time: u.created_at, desc: `User ${u.name} registered` })
        })
        return activities.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10)
    }, [messages.data, users.data])

    const handleSync = async () => {
        await refetchAll()
        toast('Database synced successfully!', 'success')
    }

    if (allLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <Loader2 size={40} className="text-brand-cyan animate-spin mx-auto mb-4" />
                    <p className="text-brand-muted">Loading data from InsForge...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold gradient-text">Database Overview</h1>
                    <p className="text-sm text-brand-muted mt-1">Real-time statistics from InsForge</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs text-brand-muted">
                        <Wifi size={14} className="text-green-500" />
                        <span>InsForge Connected</span>
                    </div>
                    <button onClick={handleSync} className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-bg text-white font-semibold text-sm hover:shadow-cyan-lg transition-all hover:scale-105 active:scale-95">
                        <RefreshCw size={16} />
                        Sync Database
                    </button>
                </div>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <MetricCard title="Total Users" value={users.data.length} icon={Users} color="gradient-bg" onClick={() => navigate('/users')} />
                <MetricCard title="Total Chats" value={chats.data.length} icon={MessageSquare} color="bg-gradient-to-br from-blue-500 to-indigo-600" onClick={() => navigate('/chats')} />
                <MetricCard title="Messages Sent" value={messages.data.length} icon={MessageSquare} color="bg-gradient-to-br from-purple-500 to-pink-600" onClick={() => navigate('/messages')} />
                <MetricCard title="Online Users" value={onlineUsers} icon={Activity} color="bg-gradient-to-br from-green-500 to-emerald-600" live onClick={() => navigate('/users')} />
                <MetricCard title="Pending Requests" value={pendingRequests} icon={UserPlus} color="bg-gradient-to-br from-yellow-500 to-orange-600" onClick={() => navigate('/contact-requests')} />
                <MetricCard title="Active Calls" value={activeCalls} icon={Phone} color="bg-gradient-to-br from-red-500 to-rose-600" live onClick={() => navigate('/calls')} />
            </div>

            {/* Quick Actions */}
            <div className="card">
                <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                    {[
                        { label: 'Add User', icon: Plus, path: '/users' },
                        { label: 'Create Chat', icon: Plus, path: '/chats' },
                        { label: 'View Analytics', icon: BarChart3, path: '/analytics' },
                        { label: 'Execute Query', icon: PlayCircle, path: '/query-builder' },
                        {
                            label: 'Export Database', icon: Download, action: () => {
                                const data = { users: users.data, chats: chats.data, messages: messages.data, contactRequests: contactRequests.data, userContacts: userContacts.data, calls: calls.data, callSignals: callSignals.data }
                                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url; a.download = `amik_chat_backup_${Date.now()}.json`; a.click()
                                URL.revokeObjectURL(url)
                                toast('Database exported successfully!', 'success')
                            }
                        },
                        { label: 'Refresh All', icon: RefreshCw, action: handleSync },
                    ].map((item) => (
                        <button
                            key={item.label}
                            onClick={item.action || (() => navigate(item.path))}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-card border border-brand-border text-sm text-brand-text font-medium hover:border-brand-cyan hover:shadow-cyan transition-all duration-200"
                        >
                            <item.icon size={16} />
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="card">
                    <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                        {recentActivity.length === 0 ? (
                            <p className="text-sm text-brand-muted text-center py-8">No recent activity</p>
                        ) : (
                            recentActivity.map((act, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-brand-border/30 transition-colors">
                                    <span className={`badge text-[10px] ${act.type === 'INSERT' ? 'bg-green-500/20 text-green-400' :
                                            act.type === 'UPDATE' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-red-500/20 text-red-400'
                                        }`}>
                                        {act.type}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-brand-text truncate">{act.desc}</p>
                                        <p className="text-xs text-brand-muted">{act.table} • {act.id?.slice(0, 12)}</p>
                                    </div>
                                    <span className="text-xs text-brand-muted whitespace-nowrap">{formatRelativeTime(act.time)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* System Health */}
                <div className="card">
                    <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-4">System Health</h3>
                    <div className="space-y-4">
                        {[
                            { label: 'InsForge Connection', status: 'Connected', ok: !users.error },
                            { label: 'Data Source', status: 'InsForge PostgreSQL', ok: true },
                            { label: 'Tables Loaded', status: '7 tables', ok: true },
                            { label: 'Users Table', status: users.error ? 'Error' : `${users.data.length} records`, ok: !users.error },
                            { label: 'Messages Table', status: messages.error ? 'Error' : `${messages.data.length} records`, ok: !messages.error },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-brand-bg/50">
                                <span className="text-sm text-brand-text">{item.label}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-brand-muted">{item.status}</span>
                                    <span className={`w-2 h-2 rounded-full ${item.ok ? 'bg-green-500' : 'bg-red-500'}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table Summary */}
            <div className="card">
                <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-4">Table Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {[
                        { name: 'users', count: users.data.length },
                        { name: 'chats', count: chats.data.length },
                        { name: 'messages', count: messages.data.length },
                        { name: 'contact_requests', count: contactRequests.data.length },
                        { name: 'user_contacts', count: userContacts.data.length },
                        { name: 'calls', count: calls.data.length },
                        { name: 'call_signals', count: callSignals.data.length },
                    ].map((t) => (
                        <div key={t.name} className="p-3 rounded-lg bg-brand-bg/50 border border-brand-border/50 text-center">
                            <p className="text-lg font-bold text-brand-text">{t.count}</p>
                            <p className="text-[11px] text-brand-muted font-mono">{t.name}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
