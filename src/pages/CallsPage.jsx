import { useState, useMemo } from 'react'
import { useInsforge } from '../hooks/useInsforge'
import DataTable from '../components/DataTable'
import SearchFilter from '../components/SearchFilter'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { AvatarGroup } from '../components/Avatar'
import { StatusBadge, CallTypeBadge } from '../components/Badge'
import { useToast } from '../components/Toast'
import { formatRelativeTime, truncateId, generateId, nowISO } from '../utils/helpers'
import { Plus, Eye, Trash2, PhoneOff, Loader2 } from 'lucide-react'

export default function CallsPage() {
    const { calls, users } = useInsforge()
    const { data: callsData, loading, addItem, updateItem, deleteItem } = calls
    const { data: usersData } = users
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [modalMode, setModalMode] = useState(null)
    const [currentCall, setCurrentCall] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [saving, setSaving] = useState(false)
    const toast = useToast()

    const [form, setForm] = useState({ id: '', participants: [], is_video: false, status: 'active' })
    const [selectedParticipants, setSelectedParticipants] = useState([])

    const filtered = useMemo(() => {
        let result = callsData
        if (search.trim()) {
            const q = search.toLowerCase()
            result = result.filter((c) => c.id?.toLowerCase().includes(q) || c.participants?.some((p) => p.toLowerCase().includes(q)))
        }
        if (statusFilter) result = result.filter((c) => c.status === statusFilter)
        if (typeFilter === 'video') result = result.filter((c) => c.is_video)
        if (typeFilter === 'audio') result = result.filter((c) => !c.is_video)
        return result
    }, [callsData, search, statusFilter, typeFilter])

    const getUserName = (id) => usersData.find((u) => u.id === id)?.name || id
    const activeCalls = callsData.filter((c) => c.status === 'active').length

    const openAdd = () => { setForm({ id: generateId('call_'), participants: [], is_video: false, status: 'active' }); setSelectedParticipants([]); setModalMode('add') }
    const openView = (call) => { setCurrentCall(call); setModalMode('view') }

    const handleCreate = async () => {
        if (selectedParticipants.length < 2) { toast('Select at least 2 participants', 'error'); return }
        setSaving(true)
        const { error } = await addItem({ id: form.id, participants: selectedParticipants, is_video: form.is_video, status: 'active', created_at: nowISO() })
        if (error) toast(`Error: ${error}`, 'error')
        else toast('Call created', 'success')
        setSaving(false); setModalMode(null)
    }

    const handleEndCall = async (id) => {
        const { error } = await updateItem(id, { status: 'ended' })
        if (error) toast(`Error: ${error}`, 'error')
        else toast('Call ended', 'success')
    }

    const handleDelete = async (id) => {
        const { error } = await deleteItem(id)
        if (error) toast(`Error: ${error}`, 'error')
        else toast('Call deleted', 'success')
        setDeleteConfirm(null); setModalMode(null)
    }

    const columns = [
        { key: 'id', label: 'Call ID', render: (v) => <span className="text-xs font-mono text-brand-muted">{truncateId(v)}</span> },
        { key: 'participants', label: 'Participants', sortable: false, render: (v) => <AvatarGroup users={(v || []).map((id) => ({ name: getUserName(id), avatar_url: usersData.find((u) => u.id === id)?.avatar_url }))} max={3} /> },
        { key: 'is_video', label: 'Type', render: (v) => <CallTypeBadge isVideo={v} /> },
        { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
        { key: 'created_at', label: 'Started', render: (v) => <span className="text-xs text-brand-muted">{formatRelativeTime(v)}</span> },
        {
            key: 'actions', label: 'Actions', sortable: false, render: (_, row) => (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openView(row)} className="p-1.5 rounded hover:bg-brand-border/50"><Eye size={15} className="text-brand-muted" /></button>
                    {row.status === 'active' && <button onClick={() => handleEndCall(row.id)} className="p-1.5 rounded hover:bg-red-500/10" title="End Call"><PhoneOff size={15} className="text-red-400" /></button>}
                    <button onClick={() => setDeleteConfirm(row.id)} className="p-1.5 rounded hover:bg-brand-border/50"><Trash2 size={15} className="text-red-400" /></button>
                </div>
            )
        }
    ]

    if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 size={32} className="text-brand-cyan animate-spin" /></div>

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><h1 className="text-2xl font-bold gradient-text">Calls Management</h1><p className="text-sm text-brand-muted mt-1">Total: {callsData.length} | Active: {activeCalls}</p></div>
                <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-bg text-white text-sm font-semibold hover:shadow-cyan-lg"><Plus size={16} /> Create Call</button>
            </div>

            <SearchFilter searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by ID, participant..."
                filters={[
                    { key: 'status', label: 'All Status', value: statusFilter, onChange: setStatusFilter, options: [{ value: 'active', label: 'Active' }, { value: 'ended', label: 'Ended' }, { value: 'missed', label: 'Missed' }] },
                    { key: 'type', label: 'All Types', value: typeFilter, onChange: setTypeFilter, options: [{ value: 'video', label: 'Video' }, { value: 'audio', label: 'Audio' }] },
                ]}
            />

            <DataTable data={filtered} columns={columns} onRowClick={openView} emptyMessage="No calls found" emptyAction={{ label: 'Create First Call', onClick: openAdd }} />

            <Modal isOpen={modalMode === 'add'} onClose={() => setModalMode(null)} title="Create Call" size="sm"
                footer={<div className="flex items-center justify-between w-full"><button onClick={() => setModalMode(null)} className="px-5 py-2.5 rounded-lg border border-brand-border text-brand-text">Cancel</button><button onClick={handleCreate} disabled={saving} className="px-5 py-2.5 rounded-lg gradient-bg text-white font-semibold disabled:opacity-50">{saving ? 'Creating...' : 'Create'}</button></div>}
            >
                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm text-brand-text"><input type="checkbox" checked={form.is_video} onChange={(e) => setForm({ ...form, is_video: e.target.checked })} className="w-4 h-4 accent-cyan-500" /> Video Call</label>
                    <div><label className="text-xs font-medium text-brand-muted block mb-1.5">Participants (min 2)</label>
                        <div className="max-h-48 overflow-y-auto space-y-1 border border-brand-border rounded-lg p-2">
                            {usersData.map((u) => (<label key={u.id} className="flex items-center gap-3 p-2 rounded hover:bg-brand-border/30 cursor-pointer"><input type="checkbox" checked={selectedParticipants.includes(u.id)} onChange={(e) => setSelectedParticipants(e.target.checked ? [...selectedParticipants, u.id] : selectedParticipants.filter((id) => id !== u.id))} className="w-4 h-4 accent-cyan-500" /><span className="text-sm text-brand-text">{u.name}</span></label>))}
                        </div>
                        <p className="text-xs text-brand-muted mt-1">{selectedParticipants.length} selected</p>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={modalMode === 'view' && !!currentCall} onClose={() => { setModalMode(null); setCurrentCall(null) }} title="Call Details" subtitle={currentCall?.id} size="sm"
                footer={<div className="flex items-center gap-3">{currentCall?.status === 'active' && <button onClick={() => handleEndCall(currentCall.id)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm"><PhoneOff size={15} /> End Call</button>}<button onClick={() => setDeleteConfirm(currentCall?.id)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/50 text-red-400 text-sm"><Trash2 size={15} /> Delete</button></div>}
            >
                {currentCall && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">{[['Type', <CallTypeBadge isVideo={currentCall.is_video} />], ['Status', <StatusBadge status={currentCall.status} />], ['Started', formatRelativeTime(currentCall.created_at)], ['Participants', currentCall.participants?.length || 0]].map(([l, v]) => <div key={l} className="p-3 rounded-lg bg-brand-bg/50"><p className="text-[11px] text-brand-muted mb-1">{l}</p><div className="text-sm text-brand-text">{v}</div></div>)}</div>
                        <div><h4 className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">Participants</h4><div className="space-y-2">{(currentCall.participants || []).map((pid) => (<div key={pid} className="flex items-center gap-3 p-3 rounded-lg bg-brand-bg/50"><span className="text-sm text-brand-text">{getUserName(pid)}</span><span className="text-xs text-brand-muted font-mono ml-auto">{truncateId(pid, 10)}</span></div>))}</div></div>
                    </div>
                )}
            </Modal>

            <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => handleDelete(deleteConfirm)} title="Delete Call" message="This will permanently delete this call record." />
        </div>
    )
}
