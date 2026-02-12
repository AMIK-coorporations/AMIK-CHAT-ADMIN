import { useState, useMemo } from 'react'
import { useInsforge } from '../hooks/useInsforge'
import DataTable from '../components/DataTable'
import SearchFilter from '../components/SearchFilter'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Avatar from '../components/Avatar'
import { MessageTypeBadge, StatusBadge } from '../components/Badge'
import { useToast } from '../components/Toast'
import { searchFilter, formatRelativeTime, truncateText, truncateId, generateId, nowISO, copyToClipboard } from '../utils/helpers'
import { Plus, Edit, Eye, Trash2, Copy, Image, Mic, File, MapPin, Loader2 } from 'lucide-react'

export default function MessagesPage() {
    const { messages, chats, users } = useInsforge()
    const { data: messagesData, loading, addItem, updateItem, deleteItem } = messages
    const { data: chatsData } = chats
    const { data: usersData } = users
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [chatFilter, setChatFilter] = useState('')
    const [modalMode, setModalMode] = useState(null)
    const [currentMsg, setCurrentMsg] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [saving, setSaving] = useState(false)
    const toast = useToast()

    const emptyMsg = { id: '', chat_id: '', sender_id: '', type: 'text', content: { text: '' }, timestamp: '', is_read: false, is_deleted: false, is_forwarded: false, reactions: {} }
    const [form, setForm] = useState(emptyMsg)

    const filtered = useMemo(() => {
        let result = searchFilter(messagesData, search, ['id', 'sender_id', 'chat_id'])
        if (!search.trim()) result = messagesData
        else {
            const q = search.toLowerCase()
            result = messagesData.filter((m) => m.id.toLowerCase().includes(q) || m.sender_id?.toLowerCase().includes(q) || m.chat_id?.toLowerCase().includes(q) || m.content?.text?.toLowerCase().includes(q))
        }
        if (typeFilter) result = result.filter((m) => m.type === typeFilter)
        if (chatFilter) result = result.filter((m) => m.chat_id === chatFilter)
        return result
    }, [messagesData, search, typeFilter, chatFilter])

    const getUserName = (id) => usersData.find((u) => u.id === id)?.name || id
    const chatIds = [...new Set(messagesData.map((m) => m.chat_id))]

    const openAdd = () => { setForm({ ...emptyMsg, id: generateId('msg_'), timestamp: nowISO() }); setModalMode('add') }
    const openView = (msg) => { setCurrentMsg(msg); setModalMode('view') }
    const openEdit = (msg) => { setForm({ ...msg }); setModalMode('edit') }

    const handleSave = async () => {
        if (!form.chat_id || !form.sender_id) { toast('Chat and Sender are required', 'error'); return }
        setSaving(true)
        if (modalMode === 'add') {
            const { error } = await addItem({ ...form, timestamp: form.timestamp || nowISO() })
            if (error) toast(`Error: ${error}`, 'error')
            else toast('Message created', 'success')
        } else {
            const { id, ...updates } = form
            const { error } = await updateItem(form.id, updates)
            if (error) toast(`Error: ${error}`, 'error')
            else toast('Message updated', 'success')
        }
        setSaving(false); setModalMode(null)
    }

    const handleDelete = async (id) => {
        const { error } = await deleteItem(id)
        if (error) toast(`Error: ${error}`, 'error')
        else toast('Message deleted', 'success')
        setDeleteConfirm(null); setModalMode(null)
    }

    const columns = [
        { key: 'id', label: 'ID', render: (v) => <span className="text-xs font-mono text-brand-muted">{truncateId(v, 10)}</span> },
        { key: 'sender_id', label: 'Sender', render: (v) => <div className="flex items-center gap-2"><Avatar name={getUserName(v)} url={usersData.find((u) => u.id === v)?.avatar_url} size="sm" /><span className="text-sm text-brand-text">{getUserName(v)}</span></div> },
        { key: 'type', label: 'Type', render: (v) => <MessageTypeBadge type={v} /> },
        { key: 'content', label: 'Content', render: (v, row) => <span className="text-sm text-brand-muted">{truncateText(row.type === 'text' ? v?.text : row.type === 'image' ? '🖼 Image' : row.type === 'audio' ? '🎤 Audio' : row.type === 'file' ? '📁 File' : row.type === 'location' ? '📍 Location' : v?.text, 30)}</span> },
        { key: 'chat_id', label: 'Chat', render: (v) => <span className="text-xs font-mono text-brand-muted">{truncateId(v, 10)}</span> },
        { key: 'is_read', label: 'Read', render: (v) => <span className={`badge ${v ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{v ? 'Read' : 'Unread'}</span> },
        { key: 'timestamp', label: 'Time', render: (v) => <span className="text-xs text-brand-muted">{formatRelativeTime(v)}</span> },
        { key: 'actions', label: 'Actions', sortable: false, render: (_, row) => (<div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}><button onClick={() => openView(row)} className="p-1.5 rounded hover:bg-brand-border/50"><Eye size={15} className="text-brand-muted" /></button><button onClick={() => openEdit(row)} className="p-1.5 rounded hover:bg-brand-border/50"><Edit size={15} className="text-blue-400" /></button><button onClick={() => setDeleteConfirm(row.id)} className="p-1.5 rounded hover:bg-brand-border/50"><Trash2 size={15} className="text-red-400" /></button></div>) }
    ]

    if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 size={32} className="text-brand-cyan animate-spin" /></div>

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><h1 className="text-2xl font-bold gradient-text">Messages Management</h1><p className="text-sm text-brand-muted mt-1">Total: {messagesData.length} messages</p></div>
                <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-bg text-white text-sm font-semibold hover:shadow-cyan-lg"><Plus size={16} /> Add Message</button>
            </div>

            <SearchFilter searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search messages..."
                filters={[
                    { key: 'type', label: 'All Types', value: typeFilter, onChange: setTypeFilter, options: [{ value: 'text', label: 'Text' }, { value: 'image', label: 'Image' }, { value: 'audio', label: 'Audio' }, { value: 'file', label: 'File' }, { value: 'location', label: 'Location' }] },
                    { key: 'chat', label: 'All Chats', value: chatFilter, onChange: setChatFilter, options: chatIds.map((id) => ({ value: id, label: truncateId(id, 12) })) },
                ]}
            />

            <DataTable data={filtered} columns={columns} onRowClick={openView} emptyMessage="No messages found" emptyAction={{ label: 'Add First Message', onClick: openAdd }} />

            <Modal isOpen={modalMode === 'add' || modalMode === 'edit'} onClose={() => setModalMode(null)} title={modalMode === 'add' ? 'Add Message' : 'Edit Message'} size="md"
                footer={<div className="flex items-center justify-between w-full"><button onClick={() => setModalMode(null)} className="px-5 py-2.5 rounded-lg border border-brand-border text-brand-text">Cancel</button><button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-lg gradient-bg text-white font-semibold disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button></div>}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-medium text-brand-muted block mb-1.5">Chat *</label><select value={form.chat_id} onChange={(e) => setForm({ ...form, chat_id: e.target.value })} className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text"><option value="">Select chat</option>{chatsData.map((c) => <option key={c.id} value={c.id}>{truncateId(c.id, 12)} ({c.participant_ids?.length} members)</option>)}</select></div>
                        <div><label className="text-xs font-medium text-brand-muted block mb-1.5">Sender *</label><select value={form.sender_id} onChange={(e) => setForm({ ...form, sender_id: e.target.value })} className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text"><option value="">Select sender</option>{usersData.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                    </div>
                    <div><label className="text-xs font-medium text-brand-muted block mb-1.5">Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, content: e.target.value === 'text' ? { text: '' } : e.target.value === 'image' ? { url: '', caption: '' } : e.target.value === 'location' ? { latitude: 0, longitude: 0 } : { url: '' } })} className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text"><option value="text">Text</option><option value="image">Image</option><option value="audio">Audio</option><option value="file">File</option><option value="location">Location</option></select></div>
                    {form.type === 'text' && <div><label className="text-xs font-medium text-brand-muted block mb-1.5">Text Content</label><textarea value={form.content?.text || ''} onChange={(e) => setForm({ ...form, content: { ...form.content, text: e.target.value } })} rows={3} className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text" /></div>}
                    {form.type === 'image' && <><div><label className="text-xs font-medium text-brand-muted block mb-1.5">Image URL</label><input value={form.content?.url || ''} onChange={(e) => setForm({ ...form, content: { ...form.content, url: e.target.value } })} className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text" /></div><div><label className="text-xs font-medium text-brand-muted block mb-1.5">Caption</label><input value={form.content?.caption || ''} onChange={(e) => setForm({ ...form, content: { ...form.content, caption: e.target.value } })} className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text" /></div></>}
                    {(form.type === 'audio' || form.type === 'file') && <div><label className="text-xs font-medium text-brand-muted block mb-1.5">File URL</label><input value={form.content?.url || ''} onChange={(e) => setForm({ ...form, content: { ...form.content, url: e.target.value } })} className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text" /></div>}
                    {form.type === 'location' && <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-medium text-brand-muted block mb-1.5">Latitude</label><input type="number" value={form.content?.latitude || ''} onChange={(e) => setForm({ ...form, content: { ...form.content, latitude: parseFloat(e.target.value) } })} className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text" /></div><div><label className="text-xs font-medium text-brand-muted block mb-1.5">Longitude</label><input type="number" value={form.content?.longitude || ''} onChange={(e) => setForm({ ...form, content: { ...form.content, longitude: parseFloat(e.target.value) } })} className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text" /></div></div>}
                    <div className="grid grid-cols-3 gap-4">
                        <label className="flex items-center gap-2 text-sm text-brand-text"><input type="checkbox" checked={form.is_read || false} onChange={(e) => setForm({ ...form, is_read: e.target.checked })} className="w-4 h-4 accent-cyan-500" /> Read</label>
                        <label className="flex items-center gap-2 text-sm text-brand-text"><input type="checkbox" checked={form.is_deleted || false} onChange={(e) => setForm({ ...form, is_deleted: e.target.checked })} className="w-4 h-4 accent-cyan-500" /> Deleted</label>
                        <label className="flex items-center gap-2 text-sm text-brand-text"><input type="checkbox" checked={form.is_forwarded || false} onChange={(e) => setForm({ ...form, is_forwarded: e.target.checked })} className="w-4 h-4 accent-cyan-500" /> Forwarded</label>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={modalMode === 'view' && !!currentMsg} onClose={() => { setModalMode(null); setCurrentMsg(null) }} title="Message Details" subtitle={currentMsg?.id} size="md"
                footer={<div className="flex items-center gap-3"><button onClick={() => openEdit(currentMsg)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-border text-brand-text text-sm"><Edit size={15} /> Edit</button><button onClick={() => setDeleteConfirm(currentMsg?.id)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/50 text-red-400 text-sm"><Trash2 size={15} /> Delete</button></div>}
            >
                {currentMsg && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3"><Avatar name={getUserName(currentMsg.sender_id)} url={usersData.find((u) => u.id === currentMsg.sender_id)?.avatar_url} size="md" /><div><p className="text-sm font-medium text-brand-text">{getUserName(currentMsg.sender_id)}</p><p className="text-xs text-brand-muted">{formatRelativeTime(currentMsg.timestamp)}</p></div><MessageTypeBadge type={currentMsg.type} /></div>
                        <div className="p-4 rounded-lg bg-brand-bg/50">
                            {currentMsg.type === 'text' && <p className="text-sm text-brand-text whitespace-pre-wrap">{currentMsg.content?.text}</p>}
                            {currentMsg.type === 'image' && <div>{currentMsg.content?.url && <img src={currentMsg.content.url} alt="Image" className="max-h-60 rounded-lg object-cover" />}{currentMsg.content?.caption && <p className="text-sm text-brand-muted mt-2">{currentMsg.content.caption}</p>}</div>}
                            {currentMsg.type === 'audio' && <div className="flex items-center gap-3"><Mic size={20} className="text-green-400" /><a href={currentMsg.content?.url} className="text-brand-cyan text-sm hover:underline" target="_blank">Audio File</a></div>}
                            {currentMsg.type === 'file' && <div className="flex items-center gap-3"><File size={20} className="text-orange-400" /><a href={currentMsg.content?.url} className="text-brand-cyan text-sm hover:underline" target="_blank">{currentMsg.content?.name || 'Download File'}</a></div>}
                            {currentMsg.type === 'location' && <div className="flex items-center gap-3"><MapPin size={20} className="text-red-400" /><span className="text-sm text-brand-text">{currentMsg.content?.latitude}, {currentMsg.content?.longitude}</span></div>}
                        </div>
                        <div className="grid grid-cols-3 gap-3">{[['Read', currentMsg.is_read ? 'Yes' : 'No'], ['Deleted', currentMsg.is_deleted ? 'Yes' : 'No'], ['Forwarded', currentMsg.is_forwarded ? 'Yes' : 'No']].map(([l, v]) => <div key={l} className="p-3 rounded-lg bg-brand-bg/50"><p className="text-[11px] text-brand-muted">{l}</p><p className="text-sm text-brand-text">{v}</p></div>)}</div>
                    </div>
                )}
            </Modal>

            <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => handleDelete(deleteConfirm)} title="Delete Message" message="This will permanently delete this message." />
        </div>
    )
}
