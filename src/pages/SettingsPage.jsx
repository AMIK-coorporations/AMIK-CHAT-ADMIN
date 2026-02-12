import { useState, useRef } from 'react'
import { useInsforge } from '../hooks/useInsforge'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import { Download, Upload, Trash2, RefreshCw, Database, Shield, Code, Loader2 } from 'lucide-react'

export default function SettingsPage() {
    const { users, chats, messages, contactRequests, userContacts, calls, callSignals, allLoading, refetchAll } = useInsforge()
    const [resetConfirm, setResetConfirm] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const fileInputRef = useRef(null)
    const toast = useToast()

    const totalRecords = users.data.length + chats.data.length + messages.data.length + contactRequests.data.length + userContacts.data.length + calls.data.length + callSignals.data.length

    const handleExportAll = () => {
        const data = {
            users: users.data, chats: chats.data, messages: messages.data,
            contact_requests: contactRequests.data, user_contacts: userContacts.data,
            calls: calls.data, call_signals: callSignals.data,
            exported_at: new Date().toISOString(), source: 'InsForge'
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = `amik_chat_backup_${Date.now()}.json`; a.click()
        URL.revokeObjectURL(url)
        toast('Full backup exported!', 'success')
    }

    const handleSync = async () => {
        setSyncing(true)
        await refetchAll()
        setSyncing(false)
        toast('All tables synced from InsForge!', 'success')
    }

    const settingSections = [
        {
            title: 'Database Status', icon: Database, items: [
                { label: 'Total Records', value: totalRecords.toLocaleString(), type: 'info' },
                { label: 'Data Source', value: 'InsForge PostgreSQL', type: 'info' },
                { label: 'Tables', value: '7 tables', type: 'info' },
                { label: 'Connection', value: (users.error || chats.error) ? 'Error' : 'Connected', type: 'info' },
            ]
        },
        {
            title: 'Data Operations', icon: RefreshCw, items: [
                { label: 'Export Full Backup', description: 'Download all data as JSON', icon: Download, action: handleExportAll, variant: 'primary' },
                { label: 'Sync All Tables', description: 'Refresh data from InsForge', icon: RefreshCw, action: handleSync, variant: 'default' },
            ]
        },
        {
            title: 'System Information', icon: Code, items: [
                { label: 'App Version', value: '2.0.0 (InsForge)', type: 'info' },
                { label: 'Data Source', value: 'InsForge SDK (Live)', type: 'info' },
                { label: 'Framework', value: 'React + Vite', type: 'info' },
                { label: 'UI Framework', value: 'Tailwind CSS 3.4', type: 'info' },
                { label: 'Backend', value: 'InsForge PostgreSQL', type: 'info' },
            ]
        },
        {
            title: 'Backend Features', icon: Shield, items: [
                { label: 'Real-time Triggers', value: 'Active (users, chats, messages, contacts)', type: 'info' },
                { label: 'Storage Buckets', value: 'avatars, uploads, voice_messages', type: 'info' },
                { label: 'OAuth Providers', value: 'GitHub, Google', type: 'info' },
                { label: 'AI Models', value: '6 models available', type: 'info' },
            ]
        }
    ]

    if (allLoading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 size={32} className="text-brand-cyan animate-spin" /></div>

    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold gradient-text">Settings</h1><p className="text-sm text-brand-muted mt-1">Application configuration & database management</p></div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {settingSections.map((section) => (
                    <div key={section.title} className="card">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center"><section.icon size={18} className="text-white" /></div>
                            <h3 className="text-sm font-semibold text-brand-text uppercase tracking-wider">{section.title}</h3>
                        </div>
                        <div className="space-y-3">
                            {section.items.map((item) =>
                                item.type === 'info' ? (
                                    <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-brand-bg/50">
                                        <span className="text-sm text-brand-muted">{item.label}</span>
                                        <span className="text-sm text-brand-text font-medium">{item.value}</span>
                                    </div>
                                ) : (
                                    <button key={item.label} onClick={item.action} className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all hover:scale-[1.01] ${item.variant === 'primary' ? 'border-brand-cyan/50 hover:bg-cyan-500/10' :
                                            item.variant === 'danger' ? 'border-red-500/50 hover:bg-red-500/10' :
                                                'border-brand-border hover:bg-brand-border/30'
                                        }`}>
                                        <item.icon size={18} className={item.variant === 'primary' ? 'text-brand-cyan' : item.variant === 'danger' ? 'text-red-400' : 'text-brand-muted'} />
                                        <div><p className="text-sm text-brand-text font-medium">{item.label}</p><p className="text-xs text-brand-muted">{item.description}</p></div>
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Details */}
            <div className="card">
                <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-4">Table Details (Live from InsForge)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead><tr className="border-b border-brand-border">
                            <th className="px-4 py-2 text-xs font-semibold text-brand-muted text-left">Table</th>
                            <th className="px-4 py-2 text-xs font-semibold text-brand-muted text-left">Records</th>
                            <th className="px-4 py-2 text-xs font-semibold text-brand-muted text-left">Status</th>
                            <th className="px-4 py-2 text-xs font-semibold text-brand-muted text-left">Actions</th>
                        </tr></thead>
                        <tbody>
                            {[
                                { name: 'users', table: users },
                                { name: 'chats', table: chats },
                                { name: 'messages', table: messages },
                                { name: 'contact_requests', table: contactRequests },
                                { name: 'user_contacts', table: userContacts },
                                { name: 'calls', table: calls },
                                { name: 'call_signals', table: callSignals },
                            ].map((t) => (
                                <tr key={t.name} className="border-b border-brand-border/50 hover:bg-brand-border/10">
                                    <td className="px-4 py-3 text-sm text-brand-text font-mono">{t.name}</td>
                                    <td className="px-4 py-3 text-sm text-brand-muted">{t.table.data.length}</td>
                                    <td className="px-4 py-3"><span className={`badge ${t.table.error ? 'bg-red-500/20 text-red-400' : t.table.loading ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>{t.table.error ? 'Error' : t.table.loading ? 'Loading' : 'Connected'}</span></td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => { t.table.refetch(); toast(`${t.name} synced`, 'info') }} className="text-xs text-brand-cyan hover:underline">Sync</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
