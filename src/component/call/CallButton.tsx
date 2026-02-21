'use client'

import { Phone } from 'lucide-react'

interface CallButtonProps {
  onStartCall: VoidFunction
  disabled?: boolean
}

export const CallButton = ({ onStartCall, disabled = false }: CallButtonProps) => {
  return (
    <button
      onClick={onStartCall}
      disabled={disabled}
      className={`p-2 rounded-lg transition-colors ${
        disabled
          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
          : 'bg-green-100 hover:bg-green-200 text-green-700'
      }`}
      title={disabled ? 'Cannot start call in group rooms' : 'Start video call'}
    >
      <Phone className="w-4 h-4" />
    </button>
  )
}
