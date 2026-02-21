'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  setStatus,
  setError,
  addParticipant,
  removeParticipant,
  updateParticipant,
  toggleMute as toggleMuteAction,
  toggleVideo as toggleVideoAction,
  resetCall,
} from '@/store/slices/callSlice'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { PeerManager } from '@/lib/webrtc/PeerManager'
import { CallStatus, SignalType, type SignalPayload } from '@/utils/calls'
import type { RealtimeChannel } from '@supabase/supabase-js'

export const remoteStreams = new Map<string, MediaStream>()

export function useWebRTC(roomId: string) {
  const dispatch = useAppDispatch()
  const { myUserId, isMuted, isVideoOff } = useAppSelector(s => s.call)
  const { user } = useAppSelector(s => s.auth)
  const displayName = user?.display_name || user?.username || 'Anonymous'
  const [streamVersion, setStreamVersion] = useState(0)

  const localStreamRef = useRef<MediaStream | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const peerManagerRef = useRef<PeerManager | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = supabaseBrowser()

  const joinRoom = useCallback(async () => {
    dispatch(setStatus(CallStatus.Joining))

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      localStreamRef.current = stream
      setLocalStream(stream) 

      const pm = new PeerManager(myUserId, {
        onRemoteStream: (userId, stream) => {
          remoteStreams.set(userId, stream)
          setStreamVersion(v => v + 1)
          dispatch(updateParticipant({ userId, connectionState: 'connected' }))
        },
        onConnectionStateChange: (userId, state) => {
          dispatch(updateParticipant({ userId, connectionState: state }))
          if (state === 'failed' || state === 'disconnected') {
            dispatch(removeParticipant(userId))
            remoteStreams.delete(userId)
            pm.removePeer(userId)
          }
        },
        onIceCandidate: (payload) => {
          channelRef.current?.send({
            type: 'broadcast',
            event: 'signal',
            payload,
          })
        },
      })
      pm.setLocalStream(stream)
      peerManagerRef.current = pm

      const channel = supabase.channel(`room:${roomId}`, {
        config: { broadcast: { self: false } },
      })
      channelRef.current = channel

      channel
        .on('broadcast', { event: 'signal' }, async ({ payload }: { payload: SignalPayload }) => {
          if (payload.target && payload.target !== myUserId) return

          if (payload.type === SignalType.UserJoined) {
            const { displayName: theirName } = payload.data as { displayName: string }
            dispatch(addParticipant({
              userId: payload.from,
              displayName: theirName,
              isMuted: false,
              isVideoOff: false,
              connectionState: 'connecting',
            }))

            const offer = await pm.createOffer(payload.from)
            if (offer) {
              channel.send({
                type: 'broadcast',
                event: 'signal',
                payload: {
                  type: SignalType.Offer,
                  from: myUserId,
                  target: payload.from,
                  data: { offer, displayName },
                } satisfies SignalPayload,
              })
            }
          }

          if (payload.type === SignalType.Offer) {
            const data = payload.data as { offer: RTCSessionDescriptionInit; displayName: string } | null
          
            
            if (!data || !data.offer || !data.offer.sdp) {
              return
            }
            const { offer: offerData, displayName: theirName } = data
            
            // Reconstruct offer with explicit type to fix serialization issues
            const reconstructedOffer: RTCSessionDescriptionInit = {
              type: 'offer' as RTCSdpType,
              sdp: offerData.sdp
            }
          
            
            dispatch(addParticipant({
              userId: payload.from,
              displayName: theirName || payload.from,
              isMuted: false,
              isVideoOff: false,
              connectionState: 'connecting',
            }))

            try {
              const answer = await pm.handleOffer(payload.from, reconstructedOffer)
             
              if (!answer.sdp) {
                console.error('Invalid answer created - missing sdp:', answer)
                return
              }
              const validAnswer: RTCSessionDescriptionInit = {
                type: 'answer' as RTCSdpType,
                sdp: answer.sdp
              }
            
              channel.send({
                type: 'broadcast',
                event: 'signal',
                payload: {
                  type: SignalType.Answer,
                  from: myUserId,
                  target: payload.from,
                  data: validAnswer,
                } satisfies SignalPayload,
              })
            } catch (err) {
              console.error('Error handling offer:', err)
            }
          }

          if (payload.type === SignalType.Answer) {
            const answerData = payload.data as RTCSessionDescriptionInit | null
            if (!answerData || !answerData.sdp) {
              console.error('Invalid answer received:', answerData)
              return
            }
            const reconstructedAnswer: RTCSessionDescriptionInit = {
              type: 'answer',
              sdp: answerData.sdp
            }
            await pm.handleAnswer(payload.from, reconstructedAnswer)
          }

          if (payload.type === SignalType.IceCandidate) {
            await pm.handleIceCandidate(payload.from, payload.data as RTCIceCandidateInit)
          }

          if (payload.type === SignalType.UserLeft) {
            dispatch(removeParticipant(payload.from))
            remoteStreams.delete(payload.from)
            pm.removePeer(payload.from)
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            channel.send({
              type: 'broadcast',
              event: 'signal',
              payload: {
                type: SignalType.UserJoined,
                from: myUserId,
                data: { displayName },
              } satisfies SignalPayload,
            })
            dispatch(setStatus(CallStatus.Connected))
          }
        })

    } catch (err) {
      dispatch(setError((err as Error).message))
    }
  }, [roomId, myUserId, displayName, dispatch, supabase])

  const handleAutoJoin = useCallback(() => {
    if (roomId && roomId.trim() !== '') {
      setTimeout(() => joinRoom(), 0)
    }
  }, [roomId, joinRoom])

  useEffect(() => {
    handleAutoJoin()
  }, [handleAutoJoin])

  const leaveRoom = useCallback(async () => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'signal',
      payload: {
        type: SignalType.UserLeft,
        from: myUserId,
        data: null,
      } satisfies SignalPayload,
    })

    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    peerManagerRef.current?.destroy()
    remoteStreams.clear()
    localStreamRef.current = null
    setLocalStream(null) 
    dispatch(resetCall())
  }, [myUserId, dispatch, supabase])

  const toggleAudio = useCallback(async () => {
    dispatch(toggleMuteAction())
    await peerManagerRef.current?.toggleAudio(!isMuted)
  }, [dispatch, isMuted])

  const toggleVideo = useCallback(async () => {
    dispatch(toggleVideoAction())
    await peerManagerRef.current?.toggleVideo(!isVideoOff)
  }, [dispatch, isVideoOff])

  useEffect(() => {
    return () => {
      peerManagerRef.current?.destroy()
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [supabase])

  return {
    localStream, 
    streamVersion,
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo,
    getLocalStream: () => localStreamRef.current,
  }
}