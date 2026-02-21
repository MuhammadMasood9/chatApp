'use client'

import { useEffect, useRef, useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import { callService, CallInvitation } from '@/services/callService'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useCallInvitation(roomId: string | null, isInCall: boolean) {
  const { user } = useAppSelector(state => state.auth)
  const [pendingInvitations, setPendingInvitations] = useState<CallInvitation[]>([])
  const [currentInvitation, setCurrentInvitation] = useState<CallInvitation | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

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

  const testInvitation = () => {
    if (user && roomId) {
      callService.sendCallInvitation(roomId, user.id, user.id).then(invitation => {
      }).catch(err => {
        console.error('Test invitation failed:', err)
      })
    }
  }

  return {
    pendingInvitations,
    currentInvitation,
    handleAccept,
    handleDecline,
    testInvitation
  }
}
