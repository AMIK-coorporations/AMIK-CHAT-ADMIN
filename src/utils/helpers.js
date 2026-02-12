import { v4 as uuidv4 } from 'uuid'
import { formatDistanceToNow, format, parseISO } from 'date-fns'

export const generateId = (prefix = '') => `${prefix}${uuidv4().slice(0, 8)}`

export const formatRelativeTime = (dateString) => {
    if (!dateString) return 'N/A'
    try {
        return formatDistanceToNow(parseISO(dateString), { addSuffix: true })
    } catch { return dateString }
}

export const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
        return format(parseISO(dateString), 'MMM dd, yyyy HH:mm')
    } catch { return dateString }
}

export const formatDateShort = (dateString) => {
    if (!dateString) return 'N/A'
    try {
        return format(parseISO(dateString), 'MMM dd, yyyy')
    } catch { return dateString }
}

export const truncateText = (text, maxLen = 50) => {
    if (!text) return ''
    return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}

export const truncateId = (id, len = 12) => {
    if (!id) return ''
    return id.length > len ? id.slice(0, len) + '...' : id
}

export const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export const getInitialColor = (name) => {
    if (!name) return '#3B82F6'
    const colors = ['#22D3EE', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444', '#6366F1']
    const idx = name.charCodeAt(0) % colors.length
    return colors[idx]
}

export const searchFilter = (items, query, fields) => {
    if (!query || !query.trim()) return items
    const q = query.toLowerCase().trim()
    return items.filter(item =>
        fields.some(field => {
            const val = item[field]
            if (val === null || val === undefined) return false
            return String(val).toLowerCase().includes(q)
        })
    )
}

export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text)
        return true
    } catch {
        return false
    }
}

export const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export const nowISO = () => new Date().toISOString()
