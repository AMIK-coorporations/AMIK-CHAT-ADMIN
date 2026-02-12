import { useState, useMemo } from 'react'
import { useInsforge } from '../hooks/useInsforge'
import { insforge } from '../lib/insforge'
import DataTable from '../components/DataTable'
import SearchFilter from '../components/SearchFilter'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Avatar from '../components/Avatar'
import { useToast } from '../components/Toast'
import { searchFilter, formatRelativeTime, truncateId, nowISO } from '../utils/helpers'
import { Plus, Edit, Eye, Trash2, Loader2 } from 'lucide-react'

export default function UserContactsPage() {
    const { userContacts, users } = useInsforge()
    const { data: contactsData, loading, addItem, updateItem, deleteItem } = userContacts
    const { data: usersData } = users
    const [search, setSearch] = useState('')
    const [userFilter, setUserFilter] = useState('')
    const [modalMode, setModalMode] = useState(null)
    const [currentContact, setCurrentContact] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [saving, setSaving] = useState(false)
    const toast = useToast()

    const [form, setForm] = useState({ user_id: '', contact_id: '', contact_name: '', contact_avatar_url: '' })

    const filtered = useMemo(() => {
        let result = contactsData
        if (search.trim()) {
            const q = search.toLowerCase()
            result = result.filter((c) => c.contact_name?.toLowerCase().includes(q) || c.user_id?.toLowerCase().includes(q) || c.contact_id?.toLowerCase().includes(q))
        }
        if (userFilter) result = result.filter((c) => c.user_id === userFilter)
        return result
    }, [contactsData, search, userFilter])

    const getUserName = (id) => usersData.find((u) => u.id === id)?.name || id
    const userIds = [...new Set(contactsData.map((c) => c.user_id))]

    const openAdd = () => { setForm({ user_id: '', contact_id: '', contact_name: '', contact_avatar_url: '' }); setModalMode('add') }
    const openView = (contact) => { setCurrentContact(contact); setModalMode('view') }
    const openEdit = (contact) => { setForm({ ...contact }); setModalMode('edit') }

    const handleSave = async () => {
        if (!form.user_id || !form.contact_id) { toast('User and Contact are required', 'error'); return }
        setSaving(true)
        if (modalMode === 'add') {
            const u = usersData.find((x) => x.id === form.contact_id)
            const { error } = await addItem({ ...form, contact_name: form.contact_name || u?.name || '', contact_avatar_url: form.contact_avatar_url || u?.avatar_url || '', added_at: nowISO() })
            if (error) toast(`Error: ${error}`, 'error')
            else toast('Contact added', 'success')
        } else {
            // user_contacts has composite PK, update by user_id+contact_id
            const { error } = await updateItem(form.user_id, { contact_name: form.contact_name, contact_avatar_url: form.contact_avatar_url })
            if (error) toast(`Error: ${error}`, 'error')
            else toast('Contact updated', 'success')
        }
        setSaving(false); setModalMode(null)
    }

    const handleDelete = async (contact) => {
        // Composite key: delete by user_id and contact_id
        try {
            const { error } = await insforge.database.from('user_contacts').delete().eq('user_id', contact.user_id).eq('contact_id', contact.contact_id)
            if (error) throw error
            userContacts.refetch()
            toast('Contact deleted', 'success')
        } catch (err) {
            toast(`Error: ${err?.message || 'Delete failed'}`, 'error')
        }
        setDeleteConfirm(null); setModalMode(null)
    }

    const columns = [
        { key: 'user_id', label: 'User', render: (v) => <div className="flex items-center gap-2"><Avatar name={getUserName(v)} url={usersData.find((u) => u.id === v)?.avatar_url} size="sm" /><span className="text-sm text-brand-text">{getUserName(v)}</span></div> },
        { key: 'contact_name', label: 'Contact Name', render: (v) => <span className="text-sm text-brand-text">{v || '—'}</span> },
        { key: 'contact_id', label: 'Contact', render: (v) => <div className="flex items-center gap-2"><Avatar name={getUserName(v)} url={usersData.find((u) => u.id === v)?.avatar_url} size="sm" /><span className="text-sm text-brand-text">{getUserName(v)}</span></div> },
        { key: 'added_at', label: 'Added', render: (v) => <span className="text-xs text-brand-muted">{formatRelativeTime(v)}</span> },
        { key: 'actions', label: 'Actions', sortable: false, render: (_, row) => (<div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}><button onClick={() => openView(row)} className="p-1.5 rounded hover:bg-brand-border/50"><Eye size={15} className="text-brand-muted" /></button><button onClick={() => openEdit(row)} className="p-1.5 rounded hover:bg-brand-border/50"><Edit size={15} className="text-blue-400" /></button><button onClick={() => setDeleteConfirm(row)} className="p-1.5 rounded hover:bg-brand-border/50"><Trash2 size={15} className="text-red-400" /></button></div>) }
    ]

    if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 size={32} className="text-brand-cyan animate-spin" /></div>

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><h1 className="text-2xl font-bold gradient-text">User Contacts</h1><p className="text-sm text-brand-muted mt-1">Total: {contactsData.length} contacts</p></div>
                <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-bg text-white text-sm font-semibold hover:shadow-cyan-lg"><Plus size={16} /> Add Contact</button>
            </div>

            <SearchFilter searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by name, ID..."
                filters={[{ key: 'user', label: 'All Users', value: userFilter, onChange: setUserFilter, options: userIds.map((id) => ({ value: id, label: getUserName(id) })) }]}
            />

            <DataTable data={filtered} columns={columns} onRowClick={openView} emptyMessage="No contacts found" emptyAction={{ label: 'Add First Contact', onClick: openAdd }} />

            <Modal isOpen={modalMode === 'add' || modalMode === 'edit'} onClose={() => setModalMode(null)} title={modalMode === 'add' ? 'Add Contact' : 'Edit Contact'} size="sm"
                footer={<div className="flex items-center justify-between w-full"><button onClick={() => setModalMode(null)} className="px-5 py-2.5 rounded-lg border border-brand-border text-brand-text">Cancel</button><button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-lg gradient-bg text-white font-semibold disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button></div>}
            >
                <div className="space-y-4">
                    <div><label className="text-xs font-medium text-brand-muted block mb-1.5">User *</label><select value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} disabled={modalMode === 'edit'} className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text disabled:opacity-50"><option value="">Select user</option>{usersData.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                    <div><label className="text-xs font-medium text-brand-muted block mb-1.5">Contact *</label><select value={form.contact_id} onChange={(e) => { const u = usersData.find((x) => x.id === e.target.value); setForm({ ...form, contact_id: e.target.value, contact_name: u?.name || '', contact_avatar_url: u?.avatar_url || '' }) }} disabled={modalMode === 'edit'} className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text disabled:opacity-50"><option value="">Select contact</option>{usersData.filter((u) => u.id !== form.user_id).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                    <div><label className="text-xs font-medium text-brand-muted block mb-1.5">Display Name</label><input value={form.contact_name || ''} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text" /></div>
                </div>
            </Modal>

            <Modal isOpen={modalMode === 'view' && !!currentContact} onClose={() => { setModalMode(null); setCurrentContact(null) }} title="Contact Details" size="sm"
                footer={<div className="flex items-center gap-3"><button onClick={() => openEdit(currentContact)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-border text-brand-text text-sm"><Edit size={15} /> Edit</button><button onClick={() => setDeleteConfirm(currentContact)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/50 text-red-400 text-sm"><Trash2 size={15} /> Delete</button></div>}
            >
                {currentContact && (
                    <div className="space-y-4">
                        {[['User', getUserName(currentContact.user_id), currentContact.user_id], ['Contact', currentContact.contact_name || getUserName(currentContact.contact_id), currentContact.contact_id]].map(([label, name, id]) => (
                            <div key={label} className="p-4 rounded-lg bg-brand-bg/50"><p className="text-[11px] text-brand-muted mb-2">{label}</p><div className="flex items-center gap-3"><Avatar name={name} url={usersData.find((u) => u.id === id)?.avatar_url} size="md" /><div><p className="text-sm font-medium text-brand-text">{name}</p><p className="text-xs text-brand-muted font-mono">{id}</p></div></div></div>
                        ))}
                        <div className="p-3 rounded-lg bg-brand-bg/50"><p className="text-[11px] text-brand-muted">Added</p><p className="text-sm text-brand-text">{formatRelativeTime(currentContact.added_at)}</p></div>
                    </div>
                )}
            </Modal>

            <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => handleDelete(deleteConfirm)} title="Remove Contact" message="This will remove this contact relationship." />
        </div>
    )
}
