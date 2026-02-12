// Badge component per PRD §8
export function StatusBadge({ status }) {
    const styles = {
        online: 'bg-green-500/20 text-green-400',
        offline: 'bg-gray-500/20 text-gray-400',
        active: 'bg-green-500/20 text-green-400',
        pending: 'bg-yellow-500/20 text-yellow-400',
        accepted: 'bg-cyan-500/20 text-cyan-400',
        rejected: 'bg-red-500/20 text-red-400',
        ended: 'bg-gray-500/20 text-gray-400',
        missed: 'bg-red-500/20 text-red-400',
        deleted: 'bg-red-500/20 text-red-400 line-through',
    }

    return (
        <span className={`badge ${styles[status?.toLowerCase()] || 'bg-brand-border text-brand-muted'}`}>
            {status === 'online' || status === 'active' ? (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
            ) : null}
            {status || 'Unknown'}
        </span>
    )
}

export function MessageTypeBadge({ type }) {
    const styles = {
        text: 'bg-blue-500/20 text-blue-400',
        image: 'bg-purple-500/20 text-purple-400',
        audio: 'bg-green-500/20 text-green-400',
        file: 'bg-orange-500/20 text-orange-400',
        location: 'bg-red-500/20 text-red-400',
    }
    const icons = { text: 'A', image: '🖼', audio: '🎤', file: '📁', location: '📍' }

    return (
        <span className={`badge ${styles[type] || 'bg-brand-border text-brand-muted'}`}>
            <span>{icons[type] || '?'}</span>
            {type}
        </span>
    )
}

export function CallTypeBadge({ isVideo }) {
    return isVideo ? (
        <span className="badge bg-blue-500/20 text-blue-400">📹 Video</span>
    ) : (
        <span className="badge bg-green-500/20 text-green-400">📞 Audio</span>
    )
}

export function DirectionBadge({ direction }) {
    return (
        <span className={`badge ${direction === 'sent' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
            {direction === 'sent' ? '↗ Sent' : '↙ Received'}
        </span>
    )
}
