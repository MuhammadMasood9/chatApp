'use client'

import { useEffect, useRef, useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import { callService, CallInvitation } from '@/services/callService'
import { supabaseBrowser } from '@/lib/supabase/browser'
import type { RealtimeChannel } from '@supabase/supabase-js'

type InvitationUpdatePayload = {
  new: {
    status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  }
}

export function useCallInvitation() {
  const { user } = useAppSelector(state => state.auth)
  const [isInCall, setIsInCall] = useState<boolean>(false)
  const [pendingInvitations, setPendingInvitations] = useState<CallInvitation[]>([])
  const [currentInvitation, setCurrentInvitation] = useState<CallInvitation | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const callerChannelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (isInCall || !user) {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      return
    }

    if (channelRef.current) {
      console.log('Subscription already exists, skipping')
      return
    }

    const loadInvitations = async () => {
      try {
        const invitations = await callService.getPendingInvitations(user.id)
        setPendingInvitations(invitations)
      } catch (error) {
        console.error('Failed to load invitations:', error)
      }
    }

    loadInvitations()

    const channel = callService.subscribeToAllCallInvitations(user.id, (invitation) => {
      if (invitation.receiver_id === user.id && invitation.status === 'pending') {
        setPendingInvitations(prev => [invitation, ...prev])
        setCurrentInvitation(invitation)
      }
    })
    
    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      if (callerChannelRef.current) {
        callerChannelRef.current.unsubscribe()
        callerChannelRef.current = null
      }
    }
  }, [isInCall, user]) 

  const handleAccept = async () => {
    if (!currentInvitation) return

    try {
      await callService.updateInvitationStatus(currentInvitation.id, 'accepted')
      window.dispatchEvent(new CustomEvent('accept-call', { detail: { roomId: currentInvitation.room_id } }))
      setCurrentInvitation(null)
    } catch (error) {
      console.error('Failed to accept invitation:', error)
    }
  }

  const handleDecline = async () => {
    if (!currentInvitation) return

    try {
      await callService.updateInvitationStatus(currentInvitation.id, 'declined')
      setCurrentInvitation(null)
    } catch (error) {
      console.error('Failed to decline invitation:', error)
    }
  }

  const sendInvitation = async (roomId: string, receiverId: string) => {
    if (!user) return
    try {
      const invitation = await callService.sendCallInvitation(roomId, user.id, receiverId)
      
      const callerChannel = supabaseBrowser()
        .channel(`call_invitations:${invitation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'call_invitations',
            filter: `id=eq.${invitation.id}`,
          },
          async (payload: InvitationUpdatePayload) => {
            if (payload.new.status === 'accepted') {
              setIsInCall(true)
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('accept-call', { detail: { roomId: invitation.room_id } }))
              }, 100)
            }
          }
        )
        .subscribe()
      
      callerChannelRef.current = callerChannel
    } catch (error) {
      console.error('Failed to send invitation:', error)
    }
  }

  return {
    pendingInvitations,
    currentInvitation,
    handleAccept,
    handleDecline,
    sendInvitation,
    isInCall,
    setIsInCall,
  }
}
