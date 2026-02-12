import { useMemo } from 'react'
import { useInsforge } from '../hooks/useInsforge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'
import { Loader2 } from 'lucide-react'

const COLORS = ['#22D3EE', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444', '#6366F1']

const ChartCard = ({ title, children }) => (
    <div className="card">
        <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-4">{title}</h3>
        {children}
    </div>
)

export default function AnalyticsPage() {
    const { users, chats, messages, contactRequests, calls, allLoading } = useInsforge()

    const messagesByType = useMemo(() => {
        const groups = {}
        messages.data.forEach((m) => { groups[m.type] = (groups[m.type] || 0) + 1 })
        return Object.entries(groups).map(([name, value]) => ({ name, value }))
    }, [messages.data])

    const usersByRegion = useMemo(() => {
        const groups = {}
        users.data.forEach((u) => { const r = u.region || 'Unknown'; groups[r] = (groups[r] || 0) + 1 })
        return Object.entries(groups).map(([name, value]) => ({ name, value }))
    }, [users.data])

    const requestsByStatus = useMemo(() => {
        const groups = {}
        contactRequests.data.forEach((r) => { groups[r.status] = (groups[r.status] || 0) + 1 })
        return Object.entries(groups).map(([name, value]) => ({ name, value }))
    }, [contactRequests.data])

    const activityOverTime = useMemo(() => {
        const days = {}
        const now = new Date()
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now); d.setDate(d.getDate() - i)
            const key = d.toLocaleDateString('en', { weekday: 'short' })
            days[key] = { name: key, messages: 0, users: 0, calls: 0 }
        }
        messages.data.forEach((m) => { const d = new Date(m.timestamp).toLocaleDateString('en', { weekday: 'short' }); if (days[d]) days[d].messages++ })
        return Object.values(days)
    }, [messages.data])

    const tableStats = useMemo(() => [
        { name: 'Users', records: users.data.length },
        { name: 'Chats', records: chats.data.length },
        { name: 'Messages', records: messages.data.length },
        { name: 'Requests', records: contactRequests.data.length },
        { name: 'Calls', records: calls.data.length },
    ], [users.data, chats.data, messages.data, contactRequests.data, calls.data])

    const genderBreakdown = useMemo(() => {
        const groups = {}
        users.data.forEach((u) => { const g = u.gender || 'Not Specified'; groups[g] = (groups[g] || 0) + 1 })
        return Object.entries(groups).map(([name, value]) => ({ name, value }))
    }, [users.data])

    if (allLoading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 size={32} className="text-brand-cyan animate-spin" /></div>

    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold gradient-text">Analytics Dashboard</h1><p className="text-sm text-brand-muted mt-1">Visual insights from your InsForge database</p></div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                    { label: 'Users', value: users.data.length, color: 'text-cyan-400' },
                    { label: 'Chats', value: chats.data.length, color: 'text-blue-400' },
                    { label: 'Messages', value: messages.data.length, color: 'text-purple-400' },
                    { label: 'Requests', value: contactRequests.data.length, color: 'text-pink-400' },
                    { label: 'Calls', value: calls.data.length, color: 'text-amber-400' },
                ].map((s) => (
                    <div key={s.label} className="card text-center">
                        <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-brand-muted mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Activity (Last 7 Days)">
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={activityOverTime}>
                            <defs><linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22D3EE" stopOpacity={0.4} /><stop offset="100%" stopColor="#22D3EE" stopOpacity={0} /></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                            <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 11 }} />
                            <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 8, fontSize: 12, color: '#E2E8F0' }} />
                            <Area type="monotone" dataKey="messages" stroke="#22D3EE" fill="url(#colorMessages)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Messages by Type">
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart><Pie data={messagesByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} strokeWidth={2} stroke="#020617">{messagesByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 8, fontSize: 12, color: '#E2E8F0' }} /></PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-3 justify-center mt-2">{messagesByType.map((item, i) => (<span key={item.name} className="flex items-center gap-1.5 text-xs text-brand-muted"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />{item.name} ({item.value})</span>))}</div>
                </ChartCard>

                <ChartCard title="Users by Region">
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={usersByRegion}><CartesianGrid strokeDasharray="3 3" stroke="#1E293B" /><XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 10 }} /><YAxis stroke="#64748B" tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 8, fontSize: 12, color: '#E2E8F0' }} /><Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} /></BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Contact Requests by Status">
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart><Pie data={requestsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} strokeWidth={2} stroke="#020617">{requestsByStatus.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 8, fontSize: 12, color: '#E2E8F0' }} /></PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-3 justify-center mt-2">{requestsByStatus.map((item, i) => (<span key={item.name} className="flex items-center gap-1.5 text-xs text-brand-muted"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[(i + 2) % COLORS.length] }} />{item.name} ({item.value})</span>))}</div>
                </ChartCard>

                <ChartCard title="Gender Distribution">
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={genderBreakdown} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#1E293B" /><XAxis type="number" stroke="#64748B" tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" stroke="#64748B" tick={{ fontSize: 10 }} width={90} /><Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 8, fontSize: 12, color: '#E2E8F0' }} /><Bar dataKey="value" radius={[0, 4, 4, 0]}>{genderBreakdown.map((_, i) => <Cell key={i} fill={COLORS[(i + 4) % COLORS.length]} />)}</Bar></BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Table Records Overview">
                    <ResponsiveContainer width="100%" height={250}>
                        <RadarChart data={tableStats}><PolarGrid stroke="#1E293B" /><PolarAngleAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 11 }} /><Radar name="Records" dataKey="records" stroke="#22D3EE" fill="#22D3EE" fillOpacity={0.2} strokeWidth={2} /></RadarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    )
}
