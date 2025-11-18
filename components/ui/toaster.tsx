'use client'

import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import { CheckCircle2, AlertTriangle, Info, XOctagon } from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
  error: XOctagon,
  destructive: XOctagon,
  default: Info,
}

const iconColorClasses: Record<string, string> = {
  success: 'text-green-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
  error: 'text-red-500',
  destructive: 'text-red-500',
  default: 'text-foreground/70',
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant = 'default', ...props }) {
        const Icon = iconMap[variant || 'default']
        const iconColor = iconColorClasses[variant || 'default']
        
        return (
          <Toast key={id} variant={variant} {...props}>
            {/* Icon */}
            <div className="flex-shrink-0">
              <Icon className={cn('h-6 w-6', iconColor)} aria-hidden="true" />
            </div>
            {/* Content */}
            <div className="flex-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {/* Action */}
            {action}
            {/* Close Button */}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
