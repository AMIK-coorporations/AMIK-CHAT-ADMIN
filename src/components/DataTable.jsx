import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Database, Search } from 'lucide-react'

export default function DataTable({
    data = [],
    columns = [],
    onRowClick,
    selectable = false,
    selectedIds = [],
    onSelectionChange,
    idField = 'id',
    emptyMessage = 'No records found',
    emptyAction,
    loading = false,
}) {
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [sortField, setSortField] = useState(null)
    const [sortDir, setSortDir] = useState('asc')

    const sortedData = useMemo(() => {
        if (!sortField) return data
        return [...data].sort((a, b) => {
            const aVal = a[sortField] ?? ''
            const bVal = b[sortField] ?? ''
            const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
            return sortDir === 'asc' ? cmp : -cmp
        })
    }, [data, sortField, sortDir])

    const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
    const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortField(field)
            setSortDir('asc')
        }
    }

    const allSelected = paginatedData.length > 0 && paginatedData.every((r) => selectedIds.includes(r[idField]))

    const toggleAll = () => {
        if (allSelected) {
            onSelectionChange?.(selectedIds.filter((id) => !paginatedData.find((r) => r[idField] === id)))
        } else {
            const newIds = [...new Set([...selectedIds, ...paginatedData.map((r) => r[idField])])]
            onSelectionChange?.(newIds)
        }
    }

    const toggleRow = (id) => {
        if (selectedIds.includes(id)) {
            onSelectionChange?.(selectedIds.filter((i) => i !== id))
        } else {
            onSelectionChange?.([...selectedIds, id])
        }
    }

    if (loading) {
        return (
            <div className="card">
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex gap-4">
                            <div className="skeleton h-10 flex-1" />
                            <div className="skeleton h-10 flex-1" />
                            <div className="skeleton h-10 w-32" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className="card flex flex-col items-center justify-center py-16">
                <Database size={48} className="text-brand-muted/40 mb-4" />
                <p className="text-brand-muted text-lg font-medium">{emptyMessage}</p>
                {emptyAction && (
                    <button onClick={emptyAction.onClick} className="mt-4 px-5 py-2.5 rounded-lg gradient-bg text-white font-semibold hover:shadow-cyan transition-all">
                        {emptyAction.label}
                    </button>
                )}
            </div>
        )
    }

    return (
        <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-brand-border">
                            {selectable && (
                                <th className="px-4 py-3 text-left w-10">
                                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 rounded accent-cyan-500" />
                                </th>
                            )}
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-brand-muted text-left cursor-pointer hover:text-brand-cyan transition-colors ${col.align === 'right' ? 'text-right' : ''}`}
                                    onClick={() => col.sortable !== false && handleSort(col.key)}
                                    style={col.width ? { width: col.width } : {}}
                                >
                                    <div className={`flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : ''}`}>
                                        <span>{col.label}</span>
                                        {col.sortable !== false && (
                                            sortField === col.key ? (
                                                sortDir === 'asc' ? <ArrowUp size={14} className="text-brand-cyan" /> : <ArrowDown size={14} className="text-brand-cyan" />
                                            ) : <ArrowUpDown size={12} className="opacity-40" />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((row, idx) => (
                            <tr
                                key={row[idField] || idx}
                                className={`border-b border-brand-border/50 transition-all duration-200 hover:bg-brand-border/30 cursor-pointer ${idx % 2 === 0 ? 'bg-transparent' : 'bg-brand-bg/30'
                                    } ${selectedIds.includes(row[idField]) ? 'bg-cyan-500/10' : ''}`}
                                onClick={() => onRowClick?.(row)}
                            >
                                {selectable && (
                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(row[idField])}
                                            onChange={() => toggleRow(row[idField])}
                                            className="w-4 h-4 rounded accent-cyan-500"
                                        />
                                    </td>
                                )}
                                {columns.map((col) => (
                                    <td key={col.key} className={`px-4 py-3 text-sm ${col.align === 'right' ? 'text-right' : ''}`}>
                                        {col.render ? col.render(row[col.key], row) : (
                                            <span className="text-brand-text">{row[col.key] ?? '—'}</span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border">
                <div className="flex items-center gap-3">
                    <span className="text-xs text-brand-muted">
                        Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, data.length)} of {data.length}
                    </span>
                    <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}
                        className="text-xs bg-brand-bg border border-brand-border rounded px-2 py-1 text-brand-text"
                    >
                        {[20, 50, 100].map((s) => (
                            <option key={s} value={s}>{s} / page</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-brand-border/50 disabled:opacity-30 transition-colors">
                        <ChevronsLeft size={16} className="text-brand-muted" />
                    </button>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-brand-border/50 disabled:opacity-30 transition-colors">
                        <ChevronLeft size={16} className="text-brand-muted" />
                    </button>
                    <span className="text-xs text-brand-muted px-3">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded hover:bg-brand-border/50 disabled:opacity-30 transition-colors">
                        <ChevronRight size={16} className="text-brand-muted" />
                    </button>
                    <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 rounded hover:bg-brand-border/50 disabled:opacity-30 transition-colors">
                        <ChevronsRight size={16} className="text-brand-muted" />
                    </button>
                </div>
            </div>
        </div>
    )
}
