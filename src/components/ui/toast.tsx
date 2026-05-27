import * as React from "react"

export type ToastProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  variant?: 'default' | 'destructive'
}

export type ToastActionElement = React.ReactElement
