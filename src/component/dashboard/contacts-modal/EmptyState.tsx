'use client'

import type { ReactNode } from 'react'

export const EmptyState = ({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode
  title: string
  subtitle: string
}) => {
  return (
    <div className="text-center py-12">
      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-100">
        {icon}
      </div>
      <p className="text-sm font-medium text-slate-400">{title}</p>
      <p className="text-xs text-slate-300 mt-1">{subtitle}</p>
    </div>
  )
}
