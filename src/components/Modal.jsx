import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, subtitle, children, size = 'md', footer }) {
    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
        if (isOpen) {
            document.addEventListener('keydown', handleEsc)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleEsc)
            document.body.style.overflow = ''
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-xl',
        lg: 'max-w-3xl',
        xl: 'max-w-5xl',
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
            <div
                className={`${sizeClasses[size]} w-full bg-brand-card border border-brand-border rounded-2xl shadow-cyan-xl modal-enter max-h-[90vh] flex flex-col`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-brand-border">
                    <div>
                        <h2 className="text-xl font-bold gradient-text">{title}</h2>
                        {subtitle && <p className="text-sm text-brand-muted mt-1">{subtitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-brand-border/50 transition-all duration-200 hover:rotate-90"
                    >
                        <X size={18} className="text-brand-muted" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="flex items-center justify-between p-6 border-t border-brand-border">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}
