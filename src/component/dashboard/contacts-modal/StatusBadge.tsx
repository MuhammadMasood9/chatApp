'use client'

import type { ContactStatus } from '@/utils/types'
import { STATUS_BADGE_META } from '@/constants/contact'

export const StatusBadge = ({ status }: { status: ContactStatus }) => {
  const meta = STATUS_BADGE_META[status]
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${meta.className}`}
    >
      {meta.label}
    </span>
  )
}
