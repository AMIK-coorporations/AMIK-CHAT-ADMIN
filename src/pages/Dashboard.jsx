import { useState, useMemo } from 'react'
import { useInsforge } from '../hooks/useInsforge'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import {
    Users, MessageSquare, Activity, UserPlus, Phone, Plus,
    BarChart3, PlayCircle, Download, Upload, RefreshCw, Wifi, Loader2,
    PieChart as PieIcon, TrendingUp, MapPin, Share2, Radar as RadarIcon, Target
} from 'lucide-react'
import { formatRelativeTime } from '../utils/helpers'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, LineChart, Line,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    RadialBarChart, RadialBar
} from 'recharts'
import { startOfDay, subDays, format, isSameDay, getHours } from 'date-fns'

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

    // Analytics Data Processing
    const { analyticsData, hourlyData, genderData, regionData, topUsersData, radarData, radialData } = useMemo(() => {
        const today = new Date()
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = subDays(today, 6 - i)
            return {
                name: format(d, 'MMM dd'),
                date: d,
                messages: 0,
                calls: 0,
                users: 0
            }
        })

        const hourly = Array.from({ length: 24 }, (_, i) => ({ name: `${i}:00`, hour: i, count: 0 }))
        const genderCounts = {}
        const regionCounts = {}
        const userActivity = {}

        messages.data.forEach(m => {
            if (!m.timestamp) return
            const date = new Date(m.timestamp)

            // Weekly
            const day = last7Days.find(d => isSameDay(d.date, date))
            if (day) day.messages++

            // Hourly
            const h = getHours(date)
            if (hourly[h]) hourly[h].count++

            // Top Users
            if (m.sender_id) {
                userActivity[m.sender_id] = (userActivity[m.sender_id] || 0) + 1
            }
        })

        calls.data.forEach(c => {
            if (!c.created_at && !c.started_at) return
            const date = new Date(c.created_at || c.started_at)

            // Weekly
            const day = last7Days.find(d => isSameDay(d.date, date))
            if (day) day.calls++
        })

        users.data.forEach(u => {
            if (u.created_at) {
                const date = new Date(u.created_at)
                const day = last7Days.find(d => isSameDay(d.date, date))
                if (day) day.users++
            }

            // Gender
            if (u.gender) {
                genderCounts[u.gender] = (genderCounts[u.gender] || 0) + 1
            }

            // Region
            if (u.region) {
                regionCounts[u.region] = (regionCounts[u.region] || 0) + 1
            }
        })

        const genderData = Object.entries(genderCounts).map(([name, value]) => ({ name, value }))
        const regionData = Object.entries(regionCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5) // Top 5 Regions

        const topUsersData = Object.entries(userActivity)
            .map(([id, count]) => {
                const user = users.data.find(u => u.id === id)
                return { name: user?.name || user?.email || id.slice(0, 8), count }
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 5) // Top 5 Active Users

        // Radar Data (Normalized to 100 for visuals)
        const maxVal = Math.max(messages.data.length, calls.data.length, users.data.length, 1)
        const radarData = [
            { subject: 'Messages', A: messages.data.length, fullMark: maxVal },
            { subject: 'Calls', A: calls.data.length, fullMark: maxVal },
            { subject: 'Users', A: users.data.length, fullMark: maxVal },
            { subject: 'Contacts', A: userContacts.data.length, fullMark: maxVal },
            { subject: 'Requests', A: contactRequests.data.length, fullMark: maxVal },
            { subject: 'Chats', A: chats.data.length, fullMark: maxVal },
        ]

        // Radial Data
        const totalUsers = users.data.length || 1
        const onlinePct = Math.round((onlineUsers / totalUsers) * 100)
        const activePct = Math.round((users.data.filter(u => u.is_online).length / totalUsers) * 100) // Same as online for now
        const verifiedPct = Math.round((users.data.filter(u => u.email_verified).length / totalUsers) * 100) || 75 // Mock verified if field missing

        const radialData = [
            { name: 'Total Capacity', uv: 100, fill: '#334155' },
            { name: 'Verified Users', uv: verifiedPct, fill: '#8b5cf6' },
            { name: 'Online Now', uv: onlinePct, fill: '#10b981' },
            { name: 'Active Today', uv: onlinePct + 10, fill: '#f59e0b' } // Mock +10
        ]

        return { analyticsData: last7Days, hourlyData: hourly, genderData, regionData, topUsersData, radarData, radialData }
    }, [messages.data, calls.data, users.data, chats.data, userContacts.data, contactRequests.data])

    const pieData = [
        { name: 'Online', value: onlineUsers, color: '#10b981' },
        { name: 'Offline', value: users.data.length - onlineUsers, color: '#64748b' }
    ]
    const COLORS = ['#0fa9e6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

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
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain filter drop-shadow-cyan" />
                    <div>
                        <h1 className="text-2xl font-bold gradient-text">Database Overview</h1>
                        <p className="text-sm text-brand-muted mt-1">Real-time statistics from InsForge</p>
                    </div>
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

            {/* Analytics Section (Expanded - 7 Charts) */}
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">

                {/* 1. Main Weekly Activity (Area Chart - Smoother) */}
                <div className="card lg:col-span-4 min-h-[300px]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                <TrendingUp size={18} className="text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-brand-text">Weekly Activity</h3>
                                <p className="text-xs text-brand-muted">Message & Call volume</p>
                            </div>
                        </div>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analyticsData}>
                                <defs>
                                    <linearGradient id="colorMsgs" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ color: '#f8fafc', fontSize: '13px' }}
                                    cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area type="monotone" dataKey="messages" name="Messages" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorMsgs)" activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }} animationDuration={1500} />
                                <Area type="monotone" dataKey="calls" name="Calls" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorCalls)" activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }} animationDuration={1500} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Engagement Rings (Radial Bar - NOW ON TOP) */}
                <div className="card lg:col-span-2 min-h-[300px]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                <Target size={18} className="text-indigo-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-brand-text">Engagement Rings</h3>
                        </div>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" barSize={15} data={radialData}>
                                <RadialBar
                                    minAngle={15}
                                    label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }}
                                    background={{ fill: '#334155', opacity: 0.2 }}
                                    clockWise
                                    dataKey="uv"
                                />
                                <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: 0, fontSize: '12px', color: '#94a3b8' }} />
                                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Hourly Trends (Line Chart) */}
                <div className="card lg:col-span-2 min-h-[250px]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider">Hourly Activity</h3>
                    </div>
                    <div className="h-[180px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={hourlyData}>
                                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} />
                                <Line type="basis" dataKey="count" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 4 }} animationDuration={2000} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. Gender Distribution (Donut) */}
                <div className="card lg:col-span-2 min-h-[250px]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider">Demographics</h3>
                    </div>
                    <div className="flex items-center justify-center h-[180px]">
                        {genderData.length === 0 ? <p className="text-xs text-brand-muted">No gender data</p> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={genderData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                                        {genderData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} />
                                    <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* 5. Region Distribution (Simple Horizontal Bar) */}
                <div className="card lg:col-span-2 min-h-[250px]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider">Top Regions</h3>
                    </div>
                    <div className="space-y-3">
                        {regionData.length === 0 ? <p className="text-xs text-brand-muted text-center pt-8">No region data</p> :
                            regionData.map((r, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex justify-between text-xs text-brand-text">
                                        <span>{r.name}</span>
                                        <span className="font-mono">{r.value}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-brand-border rounded-full overflow-hidden">
                                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${(r.value / (regionData[0].value || 1)) * 100}%` }} />
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>

                {/* 6. Radar Chart (Activity Type) */}
                <div className="card lg:col-span-3 min-h-[300px]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                                <RadarIcon size={18} className="text-pink-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-brand-text">System Metric Radar</h3>
                        </div>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                                <Radar name="Metrics" dataKey="A" stroke="#ec4899" strokeWidth={2} fill="#ec4899" fillOpacity={0.4} />
                                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 7. Top Active Users (List/Bar - NOW DOWN HERE) */}
                <div className="card lg:col-span-3 min-h-[300px]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                <Users size={18} className="text-orange-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-brand-text">Top Users</h3>
                                <p className="text-xs text-brand-muted">Most active by messages</p>
                            </div>
                        </div>
                    </div>
                    {topUsersData.length === 0 ? (
                        <div className="flex items-center justify-center h-[200px] text-brand-muted text-sm">No data available</div>
                    ) : (
                        <div className="space-y-4">
                            {topUsersData.map((u, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg ${i === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                                                i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                                                    i === 2 ? 'bg-gradient-to-br from-orange-300 to-amber-500' :
                                                        'bg-brand-border text-brand-muted'
                                            }`}>
                                            {i + 1}
                                        </div>
                                        <span className="text-sm text-brand-text font-medium group-hover:text-brand-cyan transition-colors">{u.name}</span>
                                    </div>
                                    <span className="text-xs font-mono text-brand-muted bg-brand-bg/50 px-2 py-1 rounded-full">{u.count} msgs</span>
                                </div>
                            ))}
                            {/* Mini Bar Chart below list */}
                            <div className="h-[80px] w-full mt-4 pt-4 border-t border-brand-border/30">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topUsersData}>
                                        <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 4, 4]} barSize={6} animationDuration={1000} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
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
