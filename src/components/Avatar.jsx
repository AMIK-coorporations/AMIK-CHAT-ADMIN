import { getInitials, getInitialColor } from '../utils/helpers'

export default function Avatar({ name, url, size = 'md' }) {
    const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' }

    if (url) {
        return (
            <img
                src={url}
                alt={name || 'Avatar'}
                className={`${sizes[size]} rounded-full object-cover border border-brand-border`}
            />
        )
    }

    return (
        <div
            className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white border border-brand-border/50`}
            style={{ background: `linear-gradient(135deg, ${getInitialColor(name)}, ${getInitialColor(name + 'x')})` }}
        >
            {getInitials(name)}
        </div>
    )
}

export function AvatarGroup({ users = [], max = 4, size = 'sm' }) {
    const shown = users.slice(0, max)
    const remaining = users.length - max

    return (
        <div className="flex -space-x-2">
            {shown.map((u, i) => (
                <div key={i} className="relative" style={{ zIndex: max - i }}>
                    <Avatar name={u.name || u} url={u.avatar_url} size={size} />
                </div>
            ))}
            {remaining > 0 && (
                <div className={`${size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs'} rounded-full bg-brand-border flex items-center justify-center font-semibold text-brand-muted border border-brand-card relative`} style={{ zIndex: 0 }}>
                    +{remaining}
                </div>
            )}
        </div>
    )
}
