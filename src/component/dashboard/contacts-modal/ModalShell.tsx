'use client'

import type { ReactNode } from 'react'

export const ModalShell = ({
  onClose,
  children,
}: {
  onClose: VoidFunction
  children: ReactNode
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-300/50 border border-slate-100 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
