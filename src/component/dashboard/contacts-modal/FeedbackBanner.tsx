'use client'

import type { ReactNode } from 'react'

export const FeedbackBanner = ({
  config,
}: {
  config: { icon: ReactNode; text: string; className: string }
}) => {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2.5 border rounded-xl text-xs font-medium ${config.className}`}
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  )
}
