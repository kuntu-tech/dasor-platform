'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'

import { cn } from '@/lib/utils'

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-full',
        className,
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  referrerPolicy,
  crossOrigin,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  const isGoogleAvatar =
    typeof props.src === 'string' &&
    props.src.includes('googleusercontent.com')

  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      referrerPolicy={
        referrerPolicy ?? (isGoogleAvatar ? 'no-referrer' : undefined)
      }
      crossOrigin={
        crossOrigin ?? (isGoogleAvatar ? 'anonymous' : undefined)
      }
      className={cn('aspect-square size-full', className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  delayMs = 100,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      delayMs={delayMs}
      className={cn(
        'bg-muted flex size-full items-center justify-center rounded-full',
        className,
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
