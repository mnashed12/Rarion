import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
  duration?: number
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <AlertCircle className="w-5 h-5" />
  }

  const colors = {
    success: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-600',
    error: 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-600',
    info: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-600'
  }

  return (
    <div className={`
      fixed top-20 right-4 z-50 
      flex items-center gap-3 
      px-4 py-3 rounded-xl border-2 shadow-2xl
      animate-slide-down max-w-md
      ${colors[type]}
    `}>
      {icons[type]}
      <span className="flex-1 font-medium text-sm">{message}</span>
      <button 
        onClick={onClose}
        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

interface ConfirmModalProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
}

export function ConfirmModal({ 
  message, 
  onConfirm, 
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in border-2 border-gray-200">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 mb-1">Confirm Action</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onCancel()
            }}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl transition-all shadow-lg"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
