import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { insforge } from '../lib/insforge'

// Generic hook for a single InsForge table with CRUD operations
export function useInsforgeTable(tableName, options = {}) {
    const { orderBy = 'created_at', ascending = false, idField = 'id' } = options
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Fetch all records
    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            let query = insforge.database.from(tableName).select()
            if (orderBy) {
                query = query.order(orderBy, { ascending })
            }
            const { data: result, error: err } = await query
            if (err) throw err
            setData(result || [])
        } catch (err) {
            console.error(`Error fetching ${tableName}:`, err)
            setError(err?.message || `Failed to fetch ${tableName}`)
            setData([])
        } finally {
            setLoading(false)
        }
    }, [tableName, orderBy, ascending])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Insert a new record
    const addItem = useCallback(async (item) => {
        try {
            const { data: result, error: err } = await insforge.database
                .from(tableName)
                .insert(item)
                .select()
            if (err) throw err
            // Optimistic update: add to local state
            if (result && result.length > 0) {
                setData((prev) => [result[0], ...prev])
            }
            return { data: result?.[0], error: null }
        } catch (err) {
            console.error(`Error inserting into ${tableName}:`, err)
            return { data: null, error: err?.message || 'Insert failed' }
        }
    }, [tableName])

    // Update a record by ID
    const updateItem = useCallback(async (id, updates) => {
        try {
            const { data: result, error: err } = await insforge.database
                .from(tableName)
                .update(updates)
                .eq(idField, id)
                .select()
            if (err) throw err
            // Optimistic update
            setData((prev) => prev.map((item) => item[idField] === id ? { ...item, ...updates, ...(result?.[0] || {}) } : item))
            return { data: result?.[0], error: null }
        } catch (err) {
            console.error(`Error updating ${tableName}:`, err)
            return { data: null, error: err?.message || 'Update failed' }
        }
    }, [tableName, idField])

    // Delete a record by ID
    const deleteItem = useCallback(async (id) => {
        try {
            const { error: err } = await insforge.database
                .from(tableName)
                .delete()
                .eq(idField, id)
            if (err) throw err
            // Optimistic update
            setData((prev) => prev.filter((item) => item[idField] !== id))
            return { error: null }
        } catch (err) {
            console.error(`Error deleting from ${tableName}:`, err)
            return { error: err?.message || 'Delete failed' }
        }
    }, [tableName, idField])

    // Bulk delete
    const deleteItems = useCallback(async (ids) => {
        try {
            const { error: err } = await insforge.database
                .from(tableName)
                .delete()
                .in(idField, ids)
            if (err) throw err
            setData((prev) => prev.filter((item) => !ids.includes(item[idField])))
            return { error: null }
        } catch (err) {
            console.error(`Error bulk deleting from ${tableName}:`, err)
            return { error: err?.message || 'Bulk delete failed' }
        }
    }, [tableName, idField])

    return {
        data,
        setData,
        loading,
        error,
        refetch: fetchData,
        addItem,
        updateItem,
        deleteItem,
        deleteItems,
    }
}

// Context provider for all tables (shared across pages)
const InsforgeContext = createContext(null)

export function InsforgeProvider({ children }) {
    const users = useInsforgeTable('users', { orderBy: 'created_at', ascending: false })
    const chats = useInsforgeTable('chats', { orderBy: 'updated_at', ascending: false })
    const messages = useInsforgeTable('messages', { orderBy: 'timestamp', ascending: false })
    const contactRequests = useInsforgeTable('contact_requests', { orderBy: 'created_at', ascending: false })
    const userContacts = useInsforgeTable('user_contacts', { orderBy: 'added_at', ascending: false })
    const calls = useInsforgeTable('calls', { orderBy: 'created_at', ascending: false })
    const callSignals = useInsforgeTable('call_signals', { orderBy: 'timestamp', ascending: false })

    const allLoading = users.loading || chats.loading || messages.loading || contactRequests.loading || userContacts.loading || calls.loading || callSignals.loading

    const refetchAll = useCallback(async () => {
        await Promise.all([
            users.refetch(),
            chats.refetch(),
            messages.refetch(),
            contactRequests.refetch(),
            userContacts.refetch(),
            calls.refetch(),
            callSignals.refetch(),
        ])
    }, [users.refetch, chats.refetch, messages.refetch, contactRequests.refetch, userContacts.refetch, calls.refetch, callSignals.refetch])

    return (
        <InsforgeContext.Provider value={{
            users, chats, messages, contactRequests, userContacts, calls, callSignals,
            allLoading, refetchAll
        }}>
            {children}
        </InsforgeContext.Provider>
    )
}

export function useInsforge() {
    const ctx = useContext(InsforgeContext)
    if (!ctx) throw new Error('useInsforge must be used inside <InsforgeProvider>')
    return ctx
}
