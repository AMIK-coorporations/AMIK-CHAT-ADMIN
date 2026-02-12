import { useState, useMemo } from 'react'
import { useInsforge } from '../hooks/useInsforge'
import { insforge } from '../lib/insforge'
import { useToast } from '../components/Toast'
import { truncateText, nowISO, copyToClipboard } from '../utils/helpers'
import { PlayCircle, Save, Clock, Trash2, Download, Copy, Loader2, AlertTriangle } from 'lucide-react'

const QUERY_TEMPLATES = [
    { name: 'All Users', query: 'SELECT * FROM users' },
    { name: 'Online Users', query: "SELECT * FROM users WHERE is_online = true" },
    { name: 'Recent Messages', query: 'SELECT * FROM messages ORDER BY timestamp DESC LIMIT 20' },
    { name: 'Active Chats', query: 'SELECT * FROM chats ORDER BY updated_at DESC' },
    { name: 'Pending Requests', query: "SELECT * FROM contact_requests WHERE status = 'pending'" },
    { name: 'Active Calls', query: "SELECT * FROM calls WHERE status = 'active'" },
    { name: 'All Contacts', query: 'SELECT * FROM user_contacts' },
    { name: 'User Count', query: 'SELECT COUNT(*) FROM users' },
]

export default function QueryBuilderPage() {
    const { allLoading } = useInsforge()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState(null)
    const [queryError, setQueryError] = useState(null)
    const [executing, setExecuting] = useState(false)
    const [history, setHistory] = useState([])
    const [savedQueries, setSavedQueries] = useState([])
    const [activeTab, setActiveTab] = useState('templates')
    const toast = useToast()

    const executeQuery = async () => {
        if (!query.trim()) { toast('Enter a query', 'error'); return }
        setExecuting(true); setQueryError(null); setResults(null)

        try {
            // Parse the query to use InsForge SDK
            const normalizedQuery = query.trim().replace(/\s+/g, ' ')
            const selectMatch = normalizedQuery.match(/^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i)

            if (!selectMatch) {
                // For non-parseable queries, use raw SQL through insforge
                const { data, error } = await insforge.database.rpc('execute_sql', { sql_query: normalizedQuery })
                if (error) throw error
                setResults({ columns: data?.[0] ? Object.keys(data[0]) : [], rows: data || [], rowCount: data?.length || 0, executionTime: 0 })
            } else {
                const [, columns, tableName, whereClause, orderClause, limitStr] = selectMatch
                let q = insforge.database.from(tableName)

                if (columns.trim() === '*') {
                    q = q.select()
                } else {
                    q = q.select(columns.trim())
                }

                // Basic WHERE parsing
                if (whereClause) {
                    const conditions = whereClause.split(/\s+AND\s+/i)
                    for (const cond of conditions) {
                        const eqMatch = cond.match(/(\w+)\s*=\s*'?([^']*)'?/i)
                        const neqMatch = cond.match(/(\w+)\s*!=\s*'?([^']*)'?/i)
                        const gtMatch = cond.match(/(\w+)\s*>\s*'?([^']*)'?/i)
                        const ltMatch = cond.match(/(\w+)\s*<\s*'?([^']*)'?/i)
                        const likeMatch = cond.match(/(\w+)\s+(?:I?LIKE)\s+'([^']+)'/i)

                        if (neqMatch) q = q.neq(neqMatch[1], neqMatch[2] === 'true' ? true : neqMatch[2] === 'false' ? false : neqMatch[2])
                        else if (eqMatch) q = q.eq(eqMatch[1], eqMatch[2] === 'true' ? true : eqMatch[2] === 'false' ? false : eqMatch[2])
                        else if (gtMatch) q = q.gt(gtMatch[1], gtMatch[2])
                        else if (ltMatch) q = q.lt(ltMatch[1], ltMatch[2])
                        else if (likeMatch) q = q.ilike(likeMatch[1], likeMatch[2])
                    }
                }

                // ORDER BY
                if (orderClause) {
                    const parts = orderClause.trim().split(/\s+/)
                    const col = parts[0]
                    const ascending = !(parts[1] && parts[1].toUpperCase() === 'DESC')
                    q = q.order(col, { ascending })
                }

                // LIMIT
                if (limitStr) {
                    q = q.limit(parseInt(limitStr))
                }

                const startTime = performance.now()
                const { data, error } = await q
                const executionTime = Math.round(performance.now() - startTime)

                if (error) throw error

                setResults({
                    columns: data?.[0] ? Object.keys(data[0]) : [],
                    rows: data || [],
                    rowCount: data?.length || 0,
                    executionTime
                })
            }

            setHistory((prev) => [{ query: query.trim(), time: nowISO(), status: 'success' }, ...prev.slice(0, 19)])
            toast('Query executed successfully', 'success')
        } catch (err) {
            setQueryError(err?.message || 'Query execution failed')
            setHistory((prev) => [{ query: query.trim(), time: nowISO(), status: 'error', error: err?.message }, ...prev.slice(0, 19)])
            toast('Query failed', 'error')
        } finally {
            setExecuting(false)
        }
    }

    const handleSave = () => {
        if (!query.trim()) return
        const name = prompt('Query name:')
        if (!name) return
        setSavedQueries((prev) => [{ name, query: query.trim(), saved_at: nowISO() }, ...prev])
        toast('Query saved', 'success')
    }

    const handleExportResults = () => {
        if (!results) return
        const blob = new Blob([JSON.stringify(results.rows, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = `query_results_${Date.now()}.json`; a.click()
        URL.revokeObjectURL(url)
        toast('Results exported', 'success')
    }

    if (allLoading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 size={32} className="text-brand-cyan animate-spin" /></div>

    return (
        <div className="space-y-4">
            <div><h1 className="text-2xl font-bold gradient-text">Query Builder</h1><p className="text-sm text-brand-muted mt-1">Execute SQL queries against InsForge database</p></div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="space-y-4">
                    <div className="flex gap-1 p-1 bg-brand-card rounded-lg border border-brand-border">
                        {['templates', 'saved', 'history'].map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${activeTab === tab ? 'gradient-bg text-white' : 'text-brand-muted hover:text-brand-text'}`}>{tab[0].toUpperCase() + tab.slice(1)}</button>
                        ))}
                    </div>
                    <div className="card max-h-80 overflow-y-auto space-y-1">
                        {activeTab === 'templates' && QUERY_TEMPLATES.map((t) => (<button key={t.name} onClick={() => setQuery(t.query)} className="w-full text-left p-3 rounded-lg hover:bg-brand-border/30 transition-colors"><p className="text-sm text-brand-text font-medium">{t.name}</p><p className="text-[11px] text-brand-muted font-mono mt-1 truncate">{t.query}</p></button>))}
                        {activeTab === 'saved' && (savedQueries.length === 0 ? <p className="text-sm text-brand-muted text-center py-6">No saved queries</p> : savedQueries.map((sq, i) => (<div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-brand-border/30"><button onClick={() => setQuery(sq.query)} className="text-left flex-1"><p className="text-sm text-brand-text">{sq.name}</p><p className="text-[11px] text-brand-muted font-mono truncate">{sq.query}</p></button><button onClick={() => setSavedQueries((prev) => prev.filter((_, j) => j !== i))} className="p-1 text-red-400 hover:bg-red-500/10 rounded"><Trash2 size={12} /></button></div>)))}
                        {activeTab === 'history' && (history.length === 0 ? <p className="text-sm text-brand-muted text-center py-6">No history</p> : history.map((h, i) => (<button key={i} onClick={() => setQuery(h.query)} className="w-full text-left p-3 rounded-lg hover:bg-brand-border/30"><p className="text-xs text-brand-muted font-mono truncate">{h.query}</p><div className="flex items-center gap-2 mt-1"><span className={`w-1.5 h-1.5 rounded-full ${h.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} /><span className="text-[10px] text-brand-muted">{new Date(h.time).toLocaleTimeString()}</span></div></button>)))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Editor */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider">SQL Query</h3>
                            <div className="flex items-center gap-2">
                                <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-border text-xs text-brand-text hover:border-brand-cyan"><Save size={12} /> Save</button>
                                <button onClick={executeQuery} disabled={executing || !query.trim()} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg gradient-bg text-white text-xs font-semibold hover:shadow-cyan-lg disabled:opacity-50">{executing ? <Loader2 size={12} className="animate-spin" /> : <PlayCircle size={12} />} Execute</button>
                            </div>
                        </div>
                        <textarea value={query} onChange={(e) => setQuery(e.target.value)} rows={5} placeholder="SELECT * FROM users WHERE is_online = true" className="w-full px-4 py-3 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text font-mono resize-y focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan/20" onKeyDown={(e) => { if (e.ctrlKey && e.key === 'Enter') executeQuery() }} />
                        <p className="text-[10px] text-brand-muted mt-1">Press Ctrl+Enter to execute • Queries run against your live InsForge database</p>
                    </div>

                    {/* Error */}
                    {queryError && (
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                            <AlertTriangle size={18} className="text-red-400 mt-0.5 shrink-0" />
                            <div><p className="text-sm text-red-400 font-medium">Query Error</p><p className="text-xs text-red-400/80 mt-1 font-mono">{queryError}</p></div>
                        </div>
                    )}

                    {/* Results */}
                    {results && (
                        <div className="card">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider">Results</h3>
                                    <span className="text-xs text-brand-muted">{results.rowCount} rows • {results.executionTime}ms</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => { copyToClipboard(JSON.stringify(results.rows, null, 2)); toast('Results copied', 'info') }} className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-brand-border text-xs text-brand-text hover:border-brand-cyan"><Copy size={12} /> Copy</button>
                                    <button onClick={handleExportResults} className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-brand-border text-xs text-brand-text hover:border-brand-cyan"><Download size={12} /> Export</button>
                                </div>
                            </div>
                            {results.rows.length > 0 ? (
                                <div className="overflow-auto max-h-96 rounded-lg border border-brand-border">
                                    <table className="w-full">
                                        <thead className="sticky top-0"><tr className="bg-brand-bg">{results.columns.map((col) => <th key={col} className="px-3 py-2 text-xs font-semibold text-brand-muted text-left border-b border-brand-border whitespace-nowrap">{col}</th>)}</tr></thead>
                                        <tbody>{results.rows.map((row, i) => (<tr key={i} className="border-b border-brand-border/50 hover:bg-brand-border/10">{results.columns.map((col) => <td key={col} className="px-3 py-2 text-xs text-brand-text max-w-[200px] truncate">{typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? '—')}</td>)}</tr>))}</tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-sm text-brand-muted text-center py-8">No rows returned</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
