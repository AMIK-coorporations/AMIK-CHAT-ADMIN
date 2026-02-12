import { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

const ToastContext = createContext()

const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
}

const colors = {
    success: 'border-l-green-500 text-green-400',
    error: 'border-l-red-500 text-red-400',
    info: 'border-l-blue-500 text-blue-400',
    warning: 'border-l-yellow-500 text-yellow-400',
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now()
        setToasts((prev) => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, duration)
    }, [])

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={addToast}>
            {children}
            {/* Toast container - top right per PRD §11.1 */}
            <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 w-80">
                {toasts.map((toast) => {
                    const Icon = icons[toast.type]
                    return (
                        <div
                            key={toast.id}
                            className={`bg-brand-card border border-brand-border border-l-4 ${colors[toast.type]} rounded-lg p-4 shadow-cyan flex items-start gap-3 toast-enter`}
                        >
                            <Icon size={18} className="mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-brand-text flex-1">{toast.message}</p>
                            <button onClick={() => removeToast(toast.id)} className="hover:opacity-70">
                                <X size={14} className="text-brand-muted" />
                            </button>
                        </div>
                    )
                })}
            </div>
        </ToastContext.Provider>
    )
}

export const useToast = () => useContext(ToastContext)
