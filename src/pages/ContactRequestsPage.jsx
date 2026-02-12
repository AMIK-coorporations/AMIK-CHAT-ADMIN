import { useState, useMemo } from 'react'
import { useInsforge } from '../hooks/useInsforge'
import DataTable from '../components/DataTable'
import SearchFilter from '../components/SearchFilter'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Avatar from '../components/Avatar'
import { StatusBadge, DirectionBadge } from '../components/Badge'
import { useToast } from '../components/Toast'
import { searchFilter, formatRelativeTime, truncateId, generateId, nowISO } from '../utils/helpers'
import { Plus, Eye, Trash2, Check, X, Loader2 } from 'lucide-react'

export default function ContactRequestsPage() {
    const { contactRequests, users } = useInsforge()
    const { data: requestsData, loading, addItem, updateItem, deleteItem } = contactRequests
    const { data: usersData } = users
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [modalMode, setModalMode] = useState(null)
    const [currentReq, setCurrentReq] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [saving, setSaving] = useState(false)
    const toast = useToast()

    const [form, setForm] = useState({ id: '', from_user_id: '', to_user_id: '', status: 'pending', direction: 'sent' })

    const filtered = useMemo(() => {
        let result = requestsData
        if (search.trim()) {
            const q = search.toLowerCase()
            result = result.filter((r) => r.from_name?.toLowerCase().includes(q) || r.to_name?.toLowerCase().includes(q) || r.id?.toLowerCase().includes(q))
        }
        if (statusFilter) result = result.filter((r) => r.status === statusFilter)
        return result
    }, [requestsData, search, statusFilter])

    const getUserName = (id) => usersData.find((u) => u.id === id)?.name || id

    const openAdd = () => { setForm({ id: generateId('req_'), from_user_id: '', to_user_id: '', status: 'pending', direction: 'sent' }); setModalMode('add') }
    const openView = (req) => { setCurrentReq(req); setModalMode('view') }

    const handleCreate = async () => {
        if (!form.from_user_id || !form.to_user_id) { toast('Both users are required', 'error'); return }
        setSaving(true)
        const fromUser = usersData.find((u) => u.id === form.from_user_id)
        const toUser = usersData.find((u) => u.id === form.to_user_id)
        const { error } = await addItem({
            ...form, from_name: fromUser?.name || '', to_name: toUser?.name || '',
            from_avatar_url: fromUser?.avatar_url || '', to_avatar_url: toUser?.avatar_url || '',
            created_at: nowISO(), updated_at: nowISO()
        })
        if (error) toast(`Error: ${error}`, 'error')
        else toast('Request created', 'success')
        setSaving(false); setModalMode(null)
    }

    const handleAccept = async (id) => {
        const { error } = await updateItem(id, { status: 'accepted', updated_at: nowISO() })
        if (error) toast(`Error: ${error}`, 'error')
        else toast('Request accepted', 'success')
    }

    const handleReject = async (id) => {
        const { error } = await updateItem(id, { status: 'rejected', updated_at: nowISO() })
        if (error) toast(`Error: ${error}`, 'error')
        else toast('Request rejected', 'success')
    }

    const handleDelete = async (id) => {
        const { error } = await deleteItem(id)
        if (error) toast(`Error: ${error}`, 'error')
        else toast('Request deleted', 'success')
        setDeleteConfirm(null); setModalMode(null)
    }

    const pendingCount = requestsData.filter((r) => r.status === 'pending').length

    const columns = [
        { key: 'from_name', label: 'From', render: (v, row) => <div className="flex items-center gap-2"><Avatar name={v || getUserName(row.from_user_id)} url={row.from_avatar_url} size="sm" /><span className="text-sm text-brand-text">{v || getUserName(row.from_user_id)}</span></div> },
        { key: 'to_name', label: 'To', render: (v, row) => <div className="flex items-center gap-2"><Avatar name={v || getUserName(row.to_user_id)} url={row.to_avatar_url} size="sm" /><span className="text-sm text-brand-text">{v || getUserName(row.to_user_id)}</span></div> },
        { key: 'direction', label: 'Direction', render: (v) => <DirectionBadge direction={v} /> },
        { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
        { key: 'created_at', label: 'Created', render: (v) => <span className="text-xs text-brand-muted">{formatRelativeTime(v)}</span> },
        {
            key: 'actions', label: 'Actions', sortable: false, render: (_, row) => (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openView(row)} className="p-1.5 rounded hover:bg-brand-border/50"><Eye size={15} className="text-brand-muted" /></button>
                    {row.status === 'pending' && <>
                        <button onClick={() => handleAccept(row.id)} className="p-1.5 rounded hover:bg-green-500/10" title="Accept"><Check size={15} className="text-green-400" /></button>
                        <button onClick={() => handleReject(row.id)} className="p-1.5 rounded hover:bg-red-500/10" title="Reject"><X size={15} className="text-red-400" /></button>
                    </>}
                    <button onClick={() => setDeleteConfirm(row.id)} className="p-1.5 rounded hover:bg-brand-border/50"><Trash2 size={15} className="text-red-400" /></button>
                </div>
            )
        }
    ]

    if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 size={32} className="text-brand-cyan animate-spin" /></div>

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><h1 className="text-2xl font-bold gradient-text">Contact Requests</h1><p className="text-sm text-brand-muted mt-1">Total: {requestsData.length} | Pending: {pendingCount}</p></div>
                <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-bg text-white text-sm font-semibold hover:shadow-cyan-lg"><Plus size={16} /> New Request</button>
            </div>

            <SearchFilter searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by name..."
                filters={[{ key: 'status', label: 'All Status', value: statusFilter, onChange: setStatusFilter, options: [{ value: 'pending', label: 'Pending' }, { value: 'accepted', label: 'Accepted' }, { value: 'rejected', label: 'Rejected' }] }]}
            />

            <DataTable data={filtered} columns={columns} onRowClick={openView} emptyMessage="No contact requests" emptyAction={{ label: 'Create Request', onClick: openAdd }} />

            <Modal isOpen={modalMode === 'add'} onClose={() => setModalMode(null)} title="Create Contact Request" size="sm"
                footer={<div className="flex items-center justify-between w-full"><button onClick={() => setModalMode(null)} className="px-5 py-2.5 rounded-lg border border-brand-border text-brand-text">Cancel</button><button onClick={handleCreate} disabled={saving} className="px-5 py-2.5 rounded-lg gradient-bg text-white font-semibold disabled:opacity-50">{saving ? 'Creating...' : 'Create'}</button></div>}
            >
                <div className="space-y-4">
                    <div><label className="text-xs font-medium text-brand-muted block mb-1.5">From User *</label><select value={form.from_user_id} onChange={(e) => setForm({ ...form, from_user_id: e.target.value })} className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text"><option value="">Select</option>{usersData.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                    <div><label className="text-xs font-medium text-brand-muted block mb-1.5">To User *</label><select value={form.to_user_id} onChange={(e) => setForm({ ...form, to_user_id: e.target.value })} className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text"><option value="">Select</option>{usersData.filter((u) => u.id !== form.from_user_id).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                    <div><label className="text-xs font-medium text-brand-muted block mb-1.5">Direction</label><select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })} className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text"><option value="sent">Sent</option><option value="received">Received</option></select></div>
                </div>
            </Modal>

            <Modal isOpen={modalMode === 'view' && !!currentReq} onClose={() => { setModalMode(null); setCurrentReq(null) }} title="Request Details" size="sm">
                {currentReq && (
                    <div className="space-y-4">
                        {[['From', currentReq.from_name, currentReq.from_user_id, currentReq.from_avatar_url], ['To', currentReq.to_name, currentReq.to_user_id, currentReq.to_avatar_url]].map(([label, name, id, avatar]) => (
                            <div key={label} className="p-4 rounded-lg bg-brand-bg/50"><p className="text-[11px] text-brand-muted mb-2">{label}</p><div className="flex items-center gap-3"><Avatar name={name || getUserName(id)} url={avatar} size="md" /><div><p className="text-sm font-medium text-brand-text">{name || getUserName(id)}</p><p className="text-xs text-brand-muted font-mono">{id}</p></div></div></div>
                        ))}
                        <div className="grid grid-cols-3 gap-3">{[['Status', <StatusBadge status={currentReq.status} />], ['Direction', <DirectionBadge direction={currentReq.direction} />], ['Created', formatRelativeTime(currentReq.created_at)]].map(([l, v]) => <div key={l} className="p-3 rounded-lg bg-brand-bg/50"><p className="text-[11px] text-brand-muted mb-1">{l}</p><div className="text-sm">{v}</div></div>)}</div>
                    </div>
                )}
            </Modal>

            <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => handleDelete(deleteConfirm)} title="Delete Request" message="This will permanently delete this contact request." />
        </div>
    )
}
