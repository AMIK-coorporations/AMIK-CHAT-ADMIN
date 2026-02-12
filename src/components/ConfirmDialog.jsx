import { AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import Modal from './Modal'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete Permanently', requireCheck = true, danger = true }) {
    const [checked, setChecked] = useState(false)

    const handleConfirm = () => {
        if (requireCheck && !checked) return
        onConfirm()
        setChecked(false)
        onClose()
    }

    const handleClose = () => {
        setChecked(false)
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={title || 'Confirm Action'}
            size="sm"
            footer={
                <div className="flex items-center justify-between w-full">
                    <button
                        onClick={handleClose}
                        className="px-5 py-2.5 rounded-lg border border-brand-border text-brand-text font-medium hover:bg-brand-border/50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={requireCheck && !checked}
                        className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${danger
                                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed'
                                : 'gradient-bg text-white hover:shadow-cyan disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            }
        >
            <div className="flex flex-col items-center text-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${danger ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
                    <AlertTriangle size={32} className={danger ? 'text-red-400' : 'text-yellow-400'} />
                </div>
                <p className="text-brand-muted text-sm leading-relaxed">{message}</p>
                {requireCheck && (
                    <label className="flex items-center gap-3 cursor-pointer mt-2">
                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => setChecked(e.target.checked)}
                            className="w-4 h-4 rounded accent-cyan-500"
                        />
                        <span className="text-sm text-brand-muted">I understand the consequences</span>
                    </label>
                )}
            </div>
        </Modal>
    )
}
