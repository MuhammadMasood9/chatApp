'use client'

import type { ReactNode } from 'react'
import type { Contact } from '@/utils/types'
import { StatusBadge } from '@/component/dashboard/contacts-modal/StatusBadge'

export const ContactRow = ({
  contact,
  avatarClassName,
  actions,
}: {
  contact: Contact
  avatarClassName: string
  actions: ReactNode
}) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0 ${avatarClassName}`}
      >
        {contact.id.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{contact.id}</p>
        <div className="mt-0.5">
          <StatusBadge status={contact.status} />
        </div>
      </div>
      {actions}
    </div>
  )
}
