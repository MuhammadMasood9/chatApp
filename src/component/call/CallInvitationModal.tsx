'use client'

import { useMemo } from 'react'
import { FiPhone, FiX, FiVideo } from 'react-icons/fi'
import { CallInvitation } from '@/services/callService'

interface CallInvitationModalProps {
  invitation: CallInvitation | null
  onAccept: VoidFunction
  onDecline: VoidFunction
}

export const CallInvitationModal = ({ invitation, onAccept, onDecline }: CallInvitationModalProps) => {
  const callerName = useMemo(() => {
    return invitation?.caller?.display_name || invitation?.caller?.username || 'Someone'
  }, [invitation])

  if (!invitation) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl shadow-slate-300/50 border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 text-center">
          {invitation?.caller?.avatar_url ? (
            <img
              src={invitation.caller.avatar_url}
              alt={callerName}
              className="w-20 h-20 rounded-full object-cover shadow-lg mx-auto mb-4 ring-4 ring-blue-100"
            />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg mx-auto mb-4 ring-4 ring-blue-100">
              {callerName.slice(0, 2).toUpperCase()}
            </div>
          )}

          <h2 className="text-xl font-bold text-slate-900 mb-1">
            {callerName}
          </h2>

          <div className="flex items-center justify-center gap-2 text-slate-500 mb-6">
            <FiVideo className="w-4 h-4" />
            <span className="text-sm font-medium">Incoming video call...</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onDecline()
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-semibold transition-all border border-red-200"
            >
              <FiX className="w-5 h-5" />
              Decline
            </button>

            <button
              onClick={() => {
                onAccept()
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-semibold transition-all shadow-lg shadow-emerald-200"
            >
              <FiPhone className="w-5 h-5" />
              Accept
            </button>
          </div>
        </div>

        <div className="absolute top-4 right-4">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: 'ms' }} />
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: 'ms' }} />
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: 'ms' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
