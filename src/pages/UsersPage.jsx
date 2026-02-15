import { useState, useMemo } from 'react'
import { useInsforge } from '../hooks/useInsforge'
import { createClient } from '@insforge/sdk'
import { INSFORGE_CONFIG } from '../lib/insforge'
import DataTable from '../components/DataTable'
import SearchFilter from '../components/SearchFilter'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Avatar from '../components/Avatar'
import { StatusBadge } from '../components/Badge'
import { useToast } from '../components/Toast'
import { searchFilter, formatRelativeTime, formatDateShort, nowISO, truncateId } from '../utils/helpers'
import { Plus, Download, Edit, Eye, Trash2, Loader2 } from 'lucide-react'

const emptyUser = { email: '', password: '', name: '', display_name: '', avatar_url: '', photo_url: '', phone_number: '', gender: '', region: '', address: '', status: 'Available', bio: '', security_pin: '', is_online: false }

// Dummy storage to prevent session persistence when creating users
const memoryStorage = { getItem: () => null, setItem: () => { }, removeItem: () => { } }

export default function UsersPage() {
    const { users } = useInsforge()
    const { data: usersData, loading, addItem, updateItem, deleteItem, deleteItems } = users
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [regionFilter, setRegionFilter] = useState('')
    const [genderFilter, setGenderFilter] = useState('')
    const [selectedIds, setSelectedIds] = useState([])
    const [modalMode, setModalMode] = useState(null)
    const [currentUser, setCurrentUser] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
    const [saving, setSaving] = useState(false)
    const toast = useToast()

    const filtered = useMemo(() => {
        let result = searchFilter(usersData, search, ['name', 'email', 'phone_number', 'id', 'display_name'])
        if (statusFilter === 'online') result = result.filter((u) => u.is_online)
        if (statusFilter === 'offline') result = result.filter((u) => !u.is_online)
        if (regionFilter) result = result.filter((u) => u.region === regionFilter)
        if (genderFilter) result = result.filter((u) => u.gender === genderFilter)
        return result
    }, [usersData, search, statusFilter, regionFilter, genderFilter])

    const regions = [...new Set(usersData.map((u) => u.region).filter(Boolean))]
    const genders = [...new Set(usersData.map((u) => u.gender).filter(Boolean))]
    const onlineCount = usersData.filter((u) => u.is_online).length

    const [form, setForm] = useState(emptyUser)

    const openAdd = () => { setForm({ ...emptyUser }); setModalMode('add') }
    const openEdit = (user) => { setForm({ ...user }); setModalMode('edit') }
    const openView = (user) => { setCurrentUser(user); setModalMode('view') }

    const handleSave = async () => {
        if (!form.name || !form.email) { toast('Name and Email are required', 'error'); return }
        if (modalMode === 'add' && !form.password) { toast('Password is required for new users', 'error'); return }

        setSaving(true)
        if (modalMode === 'add') {
            try {
                // 1. Create Auth User (using isolated client)
                const tempClient = createClient({
                    ...INSFORGE_CONFIG,
                    storage: memoryStorage,
                    persistSession: false,
                    autoRefreshToken: false
                })

                const { data: authData, error: authError } = await tempClient.auth.signUp({
                    email: form.email,
                    password: form.password,
                    options: {
                        data: { full_name: form.name }
                    }
                })

                if (authError) throw new Error(authError.message)
                if (!authData.user) throw new Error('Failed to create auth user')

                // 2. Insert into Public Table
                const { id, password, ...payload } = form
                // Use the Auth ID for the public table record
                const { error } = await addItem({
                    ...payload,
                    id: authData.user.id,
                    created_at: nowISO(),
                    last_seen: nowISO()
                })

                if (error) throw new Error(error)

                toast('User created successfully (Auth + DB)', 'success')
            } catch (err) {
                toast(`Error: ${err.message}`, 'error')
            }
        } else {
            const { id, password, ...updates } = form
            const { error } = await updateItem(form.id, updates)
            if (error) toast(`Error: ${error}`, 'error')
            else toast('User updated successfully', 'success')
        }
        setSaving(false)
        setModalMode(null)
    }

    const handleDelete = async (id) => {
        const { error } = await deleteItem(id)
        if (error) toast(`Error: ${error}`, 'error')
        else toast('User deleted', 'success')
        setDeleteConfirm(null); setModalMode(null)
    }

    const handleBulkDelete = async () => {
        const { error } = await deleteItems(selectedIds)
        if (error) toast(`Error: ${error}`, 'error')
        else { setSelectedIds([]); toast(`${selectedIds.length} users deleted`, 'success') }
        setBulkDeleteConfirm(false)
    }

    const handleExport = () => {
        const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = 'users_export.json'; a.click()
        URL.revokeObjectURL(url)
        toast('Users exported successfully', 'success')
    }

    const columns = [
        { key: 'avatar', label: '', width: '50px', sortable: false, render: (_, row) => <Avatar name={row.name} url={row.avatar_url} size="sm" /> },
        { key: 'name', label: 'Name', render: (v, row) => <div><p className="text-brand-text font-medium">{v}</p>{row.display_name && <p className="text-xs text-brand-muted">{row.display_name}</p>}</div> },
        { key: 'email', label: 'Email', render: (v) => <span className="text-brand-muted">{v}</span> },
        { key: 'phone_number', label: 'Phone', render: (v) => <span className="text-brand-muted font-mono text-xs">{v || '—'}</span> },
        { key: 'is_online', label: 'Status', render: (v) => <StatusBadge status={v ? 'online' : 'offline'} /> },
        { key: 'last_seen', label: 'Last Seen', render: (v) => <span className="text-xs text-brand-muted">{formatRelativeTime(v)}</span> },
        { key: 'region', label: 'Region', render: (v) => <span className="text-brand-muted">{v || '—'}</span> },
        { key: 'created_at', label: 'Created', render: (v) => <span className="text-xs text-brand-muted">{formatDateShort(v)}</span> },
        {
            key: 'actions', label: 'Actions', sortable: false, render: (_, row) => (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openView(row)} className="p-1.5 rounded hover:bg-brand-border/50 transition-colors" title="View"><Eye size={15} className="text-brand-muted" /></button>
                    <button onClick={() => openEdit(row)} className="p-1.5 rounded hover:bg-brand-border/50 transition-colors" title="Edit"><Edit size={15} className="text-blue-400" /></button>
                    <button onClick={() => setDeleteConfirm(row.id)} className="p-1.5 rounded hover:bg-brand-border/50 transition-colors" title="Delete"><Trash2 size={15} className="text-red-400" /></button>
                </div>
            )
        }
    ]

    if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 size={32} className="text-brand-cyan animate-spin" /></div>

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><h1 className="text-2xl font-bold gradient-text">Users Management</h1><p className="text-sm text-brand-muted mt-1">Total: {usersData.length} users | Online: {onlineCount}</p></div>
                <div className="flex items-center gap-2">
                    {selectedIds.length > 0 && <button onClick={() => setBulkDeleteConfirm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30"><Trash2 size={15} /> Delete ({selectedIds.length})</button>}
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-border text-sm text-brand-text font-medium hover:border-brand-cyan"><Download size={15} /> Export</button>
                    <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-bg text-white text-sm font-semibold hover:shadow-cyan-lg transition-all hover:scale-105 active:scale-95"><Plus size={16} /> Add User</button>
                </div>
            </div>

            <SearchFilter searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by name, email, phone, ID..."
                filters={[
                    { key: 'status', label: 'All Status', value: statusFilter, onChange: setStatusFilter, options: [{ value: 'online', label: 'Online' }, { value: 'offline', label: 'Offline' }] },
                    { key: 'region', label: 'All Regions', value: regionFilter, onChange: setRegionFilter, options: regions.map((r) => ({ value: r, label: r })) },
                    { key: 'gender', label: 'All Genders', value: genderFilter, onChange: setGenderFilter, options: genders.map((g) => ({ value: g, label: g })) },
                ]}
            />

            <DataTable data={filtered} columns={columns} selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds} onRowClick={openView} emptyMessage="No users found" emptyAction={{ label: 'Add First User', onClick: openAdd }} />

            {/* Add/Edit Modal */}
            <Modal isOpen={modalMode === 'add' || modalMode === 'edit'} onClose={() => setModalMode(null)} title={modalMode === 'add' ? 'Add New User' : 'Edit User'} subtitle={modalMode === 'edit' ? `Editing: ${form.name}` : 'Fill in the user details'} size="md"
                footer={<div className="flex items-center justify-between w-full"><button onClick={() => setModalMode(null)} className="px-5 py-2.5 rounded-lg border border-brand-border text-brand-text font-medium hover:bg-brand-border/50">Cancel</button><button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-lg gradient-bg text-white font-semibold hover:shadow-cyan-lg disabled:opacity-50">{saving ? 'Saving...' : modalMode === 'add' ? 'Create User' : 'Update User'}</button></div>}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        ...(modalMode === 'edit' ? [{ key: 'id', label: 'ID', disabled: true }] : []),
                        { key: 'email', label: 'Email *', type: 'email' },
                        ...(modalMode === 'add' ? [{ key: 'password', label: 'Password *', type: 'text' }] : []),
                        { key: 'name', label: 'Name *' },
                        { key: 'display_name', label: 'Display Name' },
                        { key: 'phone_number', label: 'Phone Number' },
                        { key: 'avatar_url', label: 'Avatar URL' }
                    ].map((f) => (
                        <div key={f.key}><label className="text-xs font-medium text-brand-muted mb-1.5 block">{f.label}</label><input type={f.type || 'text'} value={form[f.key] || ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} disabled={f.disabled} className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text disabled:opacity-50" /></div>
                    ))}
                    <div><label className="text-xs font-medium text-brand-muted mb-1.5 block">Gender</label><select value={form.gender || ''} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                    <div><label className="text-xs font-medium text-brand-muted mb-1.5 block">Region</label><input value={form.region || ''} onChange={(e) => setForm({ ...form, region: e.target.value })} className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text" /></div>
                    <div className="sm:col-span-2"><label className="text-xs font-medium text-brand-muted mb-1.5 block">Address</label><textarea value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text resize-y" /></div>
                    <div><label className="text-xs font-medium text-brand-muted mb-1.5 block">Status</label><input value={form.status || ''} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text" /></div>
                    <div><label className="text-xs font-medium text-brand-muted mb-1.5 block">Security PIN</label><input type="password" value={form.security_pin || ''} onChange={(e) => setForm({ ...form, security_pin: e.target.value })} className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text" /></div>
                    <div className="sm:col-span-2"><label className="text-xs font-medium text-brand-muted mb-1.5 block">Bio</label><textarea value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2} className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text resize-y" /></div>
                </div>
            </Modal>

            {/* View Modal */}
            <Modal isOpen={modalMode === 'view' && !!currentUser} onClose={() => { setModalMode(null); setCurrentUser(null) }} title="User Details" subtitle={currentUser?.name} size="md"
                footer={<div className="flex items-center gap-3"><button onClick={() => { openEdit(currentUser) }} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-border text-brand-text text-sm font-medium hover:border-blue-400"><Edit size={15} /> Edit</button><button onClick={() => setDeleteConfirm(currentUser?.id)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/50 text-red-400 text-sm font-medium hover:bg-red-500/10"><Trash2 size={15} /> Delete</button></div>}
            >
                {currentUser && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4"><Avatar name={currentUser.name} url={currentUser.avatar_url} size="xl" /><div><h3 className="text-lg font-bold text-brand-text">{currentUser.name}</h3><p className="text-sm text-brand-muted">{currentUser.email}</p><StatusBadge status={currentUser.is_online ? 'online' : 'offline'} /></div></div>
                        {[{ title: 'Personal Information', fields: [['Display Name', currentUser.display_name], ['Gender', currentUser.gender], ['Bio', currentUser.bio]] }, { title: 'Contact Details', fields: [['Email', currentUser.email], ['Phone', currentUser.phone_number], ['Region', currentUser.region], ['Address', currentUser.address]] }, { title: 'Account', fields: [['ID', currentUser.id], ['Status', currentUser.status], ['Created', formatDateShort(currentUser.created_at)], ['Last Seen', formatRelativeTime(currentUser.last_seen)]] }].map((section) => (
                            <div key={section.title}><h4 className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">{section.title}</h4><div className="grid grid-cols-2 gap-3">{section.fields.map(([label, value]) => (<div key={label} className="p-3 rounded-lg bg-brand-bg/50"><p className="text-[11px] text-brand-muted mb-0.5">{label}</p><p className="text-sm text-brand-text">{value || '—'}</p></div>))}</div></div>
                        ))}
                    </div>
                )}
            </Modal>

            <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => handleDelete(deleteConfirm)} title="Delete User" message="This will delete the user and all related data. This action cannot be undone." />
            <ConfirmDialog isOpen={bulkDeleteConfirm} onClose={() => setBulkDeleteConfirm(false)} onConfirm={handleBulkDelete} title="Bulk Delete Users" message={`This will permanently delete ${selectedIds.length} selected users. This action cannot be undone.`} />
        </div>
    )
}
