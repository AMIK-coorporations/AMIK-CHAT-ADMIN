import { useState, useMemo } from 'react'
import { useInsforge } from '../hooks/useInsforge'
import DataTable from '../components/DataTable'
import SearchFilter from '../components/SearchFilter'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { AvatarGroup } from '../components/Avatar'
import { useToast } from '../components/Toast'
import { formatRelativeTime, truncateText, truncateId, generateId, nowISO, copyToClipboard } from '../utils/helpers'
import { Plus, Eye, Trash2, Copy, Loader2 } from 'lucide-react'

export default function ChatsPage() {
    const { chats, users, messages } = useInsforge()
    const { data: chatsData, loading, addItem, deleteItem } = chats
    const { data: usersData } = users
    const { data: messagesData } = messages
    const [search, setSearch] = useState('')
    const [modalMode, setModalMode] = useState(null)
    const [currentChat, setCurrentChat] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [form, setForm] = useState({ id: '', participant_ids: [], participants_info: {} })
    const [selectedParticipants, setSelectedParticipants] = useState([])
    const [saving, setSaving] = useState(false)
    const toast = useToast()

    const filtered = useMemo(() => {
        if (!search.trim()) return chatsData
        const q = search.toLowerCase()
        return chatsData.filter((c) => {
            const names = Object.values(c.participants_info || {}).map((p) => p.name?.toLowerCase()).join(' ')
            return c.id.toLowerCase().includes(q) || names.includes(q)
        })
    }, [chatsData, search])

    const openAdd = () => { setForm({ id: generateId('chat_'), participant_ids: [], participants_info: {} }); setSelectedParticipants([]); setModalMode('add') }
    const openView = (chat) => { setCurrentChat(chat); setModalMode('view') }

    const handleCreate = async () => {
        if (selectedParticipants.length < 2) { toast('Select at least 2 participants', 'error'); return }
        setSaving(true)
        const pInfo = {}; const unread = {}
        selectedParticipants.forEach((uid) => {
            const u = usersData.find((x) => x.id === uid)
            pInfo[uid] = { name: u?.name || uid, avatar_url: u?.avatar_url || '' }
            unread[uid] = 0
        })
        const { error } = await addItem({ id: form.id, participant_ids: selectedParticipants, participants_info: pInfo, last_message: { text: 'Chat created', sender_id: 'system', timestamp: nowISO() }, created_at: nowISO(), updated_at: nowISO(), unread_count: unread })
        if (error) toast(`Error: ${error}`, 'error')
        else toast('Chat created successfully', 'success')
        setSaving(false); setModalMode(null)
    }

    const handleDelete = async (id) => {
        const { error } = await deleteItem(id)
        if (error) toast(`Error: ${error}`, 'error')
        else toast('Chat deleted', 'success')
        setDeleteConfirm(null); setModalMode(null)
    }

    const getMessageCount = (chatId) => messagesData.filter((m) => m.chat_id === chatId).length

    const columns = [
        { key: 'id', label: 'Chat ID', render: (v) => (<div className="flex items-center gap-1.5"><span className="text-xs font-mono text-brand-muted">{truncateId(v)}</span><button onClick={(e) => { e.stopPropagation(); copyToClipboard(v); toast('ID copied', 'info') }} className="p-0.5 hover:text-brand-cyan"><Copy size={12} /></button></div>) },
        { key: 'participants', label: 'Participants', sortable: false, render: (_, row) => <AvatarGroup users={Object.values(row.participants_info || {})} max={4} /> },
        { key: 'last_message', label: 'Last Message', sortable: false, render: (v) => (<div><p className="text-sm text-brand-text truncate max-w-[200px]">{truncateText(v?.text, 40)}</p><p className="text-[10px] text-brand-muted">{formatRelativeTime(v?.timestamp)}</p></div>) },
        { key: 'participant_ids', label: 'Members', render: (v) => <span className="text-brand-muted">{v?.length || 0}</span> },
        { key: 'updated_at', label: 'Last Activity', render: (v) => <span className="text-xs text-brand-muted">{formatRelativeTime(v)}</span> },
        { key: 'actions', label: 'Actions', sortable: false, render: (_, row) => (<div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}><button onClick={() => openView(row)} className="p-1.5 rounded hover:bg-brand-border/50"><Eye size={15} className="text-brand-muted" /></button><button onClick={() => setDeleteConfirm(row.id)} className="p-1.5 rounded hover:bg-brand-border/50"><Trash2 size={15} className="text-red-400" /></button></div>) }
    ]

    if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 size={32} className="text-brand-cyan animate-spin" /></div>

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><h1 className="text-2xl font-bold gradient-text">Chats Management</h1><p className="text-sm text-brand-muted mt-1">Total: {chatsData.length} conversations</p></div>
                <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-bg text-white text-sm font-semibold hover:shadow-cyan-lg transition-all hover:scale-105 active:scale-95"><Plus size={16} /> Create Chat</button>
            </div>

            <SearchFilter searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by participant name, Chat ID..." />
            <DataTable data={filtered} columns={columns} onRowClick={openView} emptyMessage="No chats found" emptyAction={{ label: 'Create First Chat', onClick: openAdd }} />

            <Modal isOpen={modalMode === 'add'} onClose={() => setModalMode(null)} title="Create New Chat" subtitle="Select participants" size="md"
                footer={<div className="flex items-center justify-between w-full"><button onClick={() => setModalMode(null)} className="px-5 py-2.5 rounded-lg border border-brand-border text-brand-text font-medium">Cancel</button><button onClick={handleCreate} disabled={saving} className="px-5 py-2.5 rounded-lg gradient-bg text-white font-semibold disabled:opacity-50">{saving ? 'Creating...' : 'Create Chat'}</button></div>}
            >
                <div className="space-y-4">
                    <div><label className="text-xs font-medium text-brand-muted mb-1.5 block">Chat ID</label><input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text" /></div>
                    <div><label className="text-xs font-medium text-brand-muted mb-1.5 block">Select Participants (min 2)</label>
                        <div className="max-h-60 overflow-y-auto space-y-1 border border-brand-border rounded-lg p-2">
                            {usersData.map((u) => (<label key={u.id} className="flex items-center gap-3 p-2 rounded hover:bg-brand-border/30 cursor-pointer"><input type="checkbox" checked={selectedParticipants.includes(u.id)} onChange={(e) => { setSelectedParticipants(e.target.checked ? [...selectedParticipants, u.id] : selectedParticipants.filter((id) => id !== u.id)) }} className="w-4 h-4 accent-cyan-500" /><span className="text-sm text-brand-text">{u.name}</span><span className="text-xs text-brand-muted ml-auto">{u.email}</span></label>))}
                        </div>
                        <p className="text-xs text-brand-muted mt-1">{selectedParticipants.length} selected</p>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={modalMode === 'view' && !!currentChat} onClose={() => { setModalMode(null); setCurrentChat(null) }} title="Chat Details" subtitle={`Chat ID: ${currentChat?.id}`} size="lg"
                footer={<button onClick={() => setDeleteConfirm(currentChat?.id)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/50 text-red-400 text-sm font-medium hover:bg-red-500/10"><Trash2 size={15} /> Delete Chat</button>}
            >
                {currentChat && (
                    <div className="space-y-6">
                        <div><h4 className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">Participants ({currentChat.participant_ids?.length})</h4><div className="grid grid-cols-2 gap-2">{Object.entries(currentChat.participants_info || {}).map(([uid, info]) => (<div key={uid} className="flex items-center gap-3 p-3 rounded-lg bg-brand-bg/50"><span className="text-sm text-brand-text">{info.name}</span><span className="text-xs text-brand-muted font-mono ml-auto">{truncateId(uid, 10)}</span></div>))}</div></div>
                        <div><h4 className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">Last Message</h4><div className="p-4 rounded-lg bg-brand-bg/50"><p className="text-sm text-brand-text">{currentChat.last_message?.text || '—'}</p><p className="text-xs text-brand-muted mt-2">From: {currentChat.last_message?.sender_id} • {formatRelativeTime(currentChat.last_message?.timestamp)}</p></div></div>
                        <div className="grid grid-cols-2 gap-3 text-sm"><div className="p-3 rounded-lg bg-brand-bg/50"><p className="text-[11px] text-brand-muted">Messages</p><p className="text-brand-text font-bold">{getMessageCount(currentChat.id)}</p></div><div className="p-3 rounded-lg bg-brand-bg/50"><p className="text-[11px] text-brand-muted">Created</p><p className="text-brand-text">{formatRelativeTime(currentChat.created_at)}</p></div></div>
                    </div>
                )}
            </Modal>

            <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => handleDelete(deleteConfirm)} title="Delete Chat" message={`This will delete the chat and all ${getMessageCount(deleteConfirm)} messages. This action cannot be undone.`} />
        </div>
    )
}
