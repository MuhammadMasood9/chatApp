'use client'

import { FiX } from 'react-icons/fi'

export const ModalHeader = ({ onClose }: { onClose: VoidFunction }) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Contacts</h2>
        <p className="text-xs text-slate-400 mt-0.5">Manage your contact requests</p>
      </div>
      <button
        onClick={onClose}
        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
      >
        <FiX className="w-5 h-5" />
      </button>
    </div>
  )
}
