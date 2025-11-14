/**
 * Toast notification component
 * Displays temporary success/error messages for user actions
 */

import { useEffect } from 'react'
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

export interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const typeConfig = {
    success: {
      icon: CheckCircleIcon,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-500',
    },
    error: {
      icon: ExclamationCircleIcon,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-500',
    },
    info: {
      icon: ExclamationCircleIcon,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-500',
    },
  }

  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg shadow-lg border ${config.bgColor} ${config.borderColor} min-w-[300px] max-w-md animate-slide-up`}
    >
      <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0`} />
      <p className={`flex-1 text-sm font-medium ${config.textColor}`}>{message}</p>
      <button
        onClick={onClose}
        className={`flex-shrink-0 rounded-md p-1 hover:bg-white/50 transition-colors ${config.textColor}`}
        aria-label="Close notification"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  )
}

/**
 * Toast container component
 * Renders all active toasts in a fixed position
 */
export function ToastContainer({ toasts }: { toasts: Array<ToastProps & { id: string }> }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  )
}
