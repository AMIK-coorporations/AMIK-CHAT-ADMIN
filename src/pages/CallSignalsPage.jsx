import { useState, useMemo } from 'react'
import { useInsforge } from '../hooks/useInsforge'
import DataTable from '../components/DataTable'
import SearchFilter from '../components/SearchFilter'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { formatRelativeTime, truncateId, copyToClipboard } from '../utils/helpers'
import { Eye, Trash2, Copy, ArrowRight, Download, Loader2 } from 'lucide-react'

export default function CallSignalsPage() {
    const { callSignals, calls, users } = useInsforge()
    const { data: signalsData, loading, deleteItem } = callSignals
    const { data: callsData } = calls
    const { data: usersData } = users
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [modalMode, setModalMode] = useState(null)
    const [currentSignal, setCurrentSignal] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const toast = useToast()

    const filtered = useMemo(() => {
        let result = signalsData
        if (search.trim()) {
            const q = search.toLowerCase()
            result = result.filter((s) => s.id?.toLowerCase().includes(q) || s.call_id?.toLowerCase().includes(q) || s.from_user_id?.toLowerCase().includes(q) || s.to_user_id?.toLowerCase().includes(q))
        }
        if (typeFilter) result = result.filter((s) => s.type === typeFilter)
        return result
    }, [signalsData, search, typeFilter])

    const getUserName = (id) => usersData.find((u) => u.id === id)?.name || id

    const openView = (signal) => { setCurrentSignal(signal); setModalMode('view') }

    const handleDelete = async (id) => {
        const { error } = await deleteItem(id)
        if (error) toast(`Error: ${error}`, 'error')
        else toast('Signal deleted', 'success')
        setDeleteConfirm(null); setModalMode(null)
    }

    const handleExportSignal = (signal) => {
        const blob = new Blob([JSON.stringify(signal, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = `signal_${signal.id}.json`; a.click()
        URL.revokeObjectURL(url)
        toast('Signal exported', 'success')
    }

    const signalTypes = [...new Set(signalsData.map((s) => s.type))]

    const columns = [
        { key: 'id', label: 'Signal ID', render: (v) => <span className="text-xs font-mono text-brand-muted">{truncateId(v, 10)}</span> },
        { key: 'type', label: 'Type', render: (v) => <span className={`badge ${v === 'offer' ? 'bg-blue-500/20 text-blue-400' : v === 'answer' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>{v}</span> },
        { key: 'from_user_id', label: 'From → To', render: (_, row) => <div className="flex items-center gap-2 text-sm"><span className="text-brand-text">{getUserName(row.from_user_id)}</span><ArrowRight size={14} className="text-brand-muted" /><span className="text-brand-text">{getUserName(row.to_user_id)}</span></div> },
        { key: 'call_id', label: 'Call', render: (v) => <span className="text-xs font-mono text-brand-muted">{truncateId(v, 10)}</span> },
        { key: 'timestamp', label: 'Time', render: (v) => <span className="text-xs text-brand-muted">{formatRelativeTime(v)}</span> },
        { key: 'actions', label: 'Actions', sortable: false, render: (_, row) => (<div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}><button onClick={() => openView(row)} className="p-1.5 rounded hover:bg-brand-border/50"><Eye size={15} className="text-brand-muted" /></button><button onClick={() => { copyToClipboard(JSON.stringify(row.data)); toast('Data copied', 'info') }} className="p-1.5 rounded hover:bg-brand-border/50"><Copy size={15} className="text-brand-muted" /></button><button onClick={() => setDeleteConfirm(row.id)} className="p-1.5 rounded hover:bg-brand-border/50"><Trash2 size={15} className="text-red-400" /></button></div>) }
    ]

    if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 size={32} className="text-brand-cyan animate-spin" /></div>

    return (
        <div className="space-y-4">
            <div><h1 className="text-2xl font-bold gradient-text">Call Signals</h1><p className="text-sm text-brand-muted mt-1">WebRTC signaling data • Total: {signalsData.length}</p></div>

            <SearchFilter searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by signal ID, call ID, user..."
                filters={[{ key: 'type', label: 'All Types', value: typeFilter, onChange: setTypeFilter, options: signalTypes.map((t) => ({ value: t, label: t })) }]}
            />

            <DataTable data={filtered} columns={columns} onRowClick={openView} emptyMessage="No call signals found" />

            <Modal isOpen={modalMode === 'view' && !!currentSignal} onClose={() => { setModalMode(null); setCurrentSignal(null) }} title="Signal Details" subtitle={currentSignal?.id} size="lg"
                footer={<div className="flex items-center gap-3"><button onClick={() => handleExportSignal(currentSignal)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-border text-brand-text text-sm"><Download size={15} /> Export</button><button onClick={() => { copyToClipboard(JSON.stringify(currentSignal?.data, null, 2)); toast('Data copied', 'info') }} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-border text-brand-text text-sm"><Copy size={15} /> Copy Data</button><button onClick={() => setDeleteConfirm(currentSignal?.id)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/50 text-red-400 text-sm"><Trash2 size={15} /> Delete</button></div>}
            >
                {currentSignal && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            {[['Type', currentSignal.type], ['Call ID', truncateId(currentSignal.call_id, 12)], ['From', getUserName(currentSignal.from_user_id)], ['To', getUserName(currentSignal.to_user_id)], ['Time', formatRelativeTime(currentSignal.timestamp)]].map(([l, v]) => <div key={l} className="p-3 rounded-lg bg-brand-bg/50"><p className="text-[11px] text-brand-muted">{l}</p><p className="text-sm text-brand-text">{v}</p></div>)}
                        </div>
                        <div><h4 className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">Signal Data (JSONB)</h4><pre className="p-4 rounded-lg bg-brand-bg border border-brand-border text-xs text-brand-text overflow-auto max-h-80 font-mono">{JSON.stringify(currentSignal.data, null, 2)}</pre></div>
                    </div>
                )}
            </Modal>

            <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => handleDelete(deleteConfirm)} title="Delete Signal" message="This will permanently delete this signal record." />
        </div>
    )
}
