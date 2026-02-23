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
import { CallStatus, SignalType, type MediaStatePayload, type SignalPayload } from '@/utils/calls'
import type { RealtimeChannel } from '@supabase/supabase-js'

export const remoteStreams = new Map<string, MediaStream>()

export function useWebRTC(roomId: string) {
  const dispatch = useAppDispatch()
  const { myUserId, isMuted, isVideoOff } = useAppSelector(s => s.call)
  const { user } = useAppSelector(s => s.auth)
  const displayName = user?.display_name || user?.email || user?.id?.slice(0, 8) || 'Anonymous'
  const [streamVersion, setStreamVersion] = useState(0)

  const localStreamRef = useRef<MediaStream | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const peerManagerRef = useRef<PeerManager | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const joinInProgressRef = useRef(false)
  const hasJoinedRef = useRef(false)
  const supabase = supabaseBrowser()

  const stopAndRemoveRemoteStream = useCallback((userId: string) => {
    const stream = remoteStreams.get(userId)
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      remoteStreams.delete(userId)
      setStreamVersion(v => v + 1)
    }
  }, [])

  const joinRoom = useCallback(async () => {
    if (joinInProgressRef.current || hasJoinedRef.current) {
      return
    }
    joinInProgressRef.current = true
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
          console.log('[DEBUG] onRemoteStream:', { userId, videoTracks: stream.getVideoTracks().length, audioTracks: stream.getAudioTracks().length, streamId: stream.id })
          const existing = remoteStreams.get(userId)
          if (existing === stream) {
            console.log('[DEBUG] onRemoteStream: duplicate ignored for', userId)
            return
          }
          remoteStreams.set(userId, stream)
          setStreamVersion(v => v + 1)
          dispatch(updateParticipant({ userId, connectionState: 'connected' }))

          const audioTrack = stream.getAudioTracks()[0]
          const videoTrack = stream.getVideoTracks()[0]

          if (audioTrack) {
            console.log('[DEBUG] Audio track for', userId, ': enabled=', audioTrack.enabled, 'readyState=', audioTrack.readyState)
            audioTrack.onended = () => {
              console.log('[DEBUG] audioTrack.onended', userId)
              dispatch(updateParticipant({ userId, isMuted: true }))
            }
          }

          if (videoTrack) {
            console.log('[DEBUG] Video track for', userId, ': enabled=', videoTrack.enabled, 'readyState=', videoTrack.readyState)
            videoTrack.onended = () => {
              console.log('[DEBUG] videoTrack.onended', userId)
              dispatch(updateParticipant({ userId, isVideoOff: true }))
            }
          }
        },
        onConnectionStateChange: (userId, state) => {
          console.log('[DEBUG] onConnectionStateChange:', { userId, state })
          dispatch(updateParticipant({ userId, connectionState: state }))
          if (state === 'failed' || state === 'disconnected' || state === 'closed') {
            dispatch(removeParticipant(userId))
            stopAndRemoveRemoteStream(userId)
            pm.removePeer(userId)
          }
        },
        onIceCandidate: (payload) => {
          console.log('[DEBUG] onIceCandidate:', { userId: payload.from, candidate: payload.data })
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
            console.log('[DEBUG] UserJoined received:', { from: payload.from, theirName, myUserId })
            dispatch(addParticipant({
              userId: payload.from,
              displayName: theirName,
              isMuted: false,
              isVideoOff: false,
              connectionState: 'connecting',
            }))

            console.log('[DEBUG] Sending MediaState to', payload.from)
            channel.send({
              type: 'broadcast',
              event: 'signal',
              payload: {
                type: SignalType.MediaState,
                from: myUserId,
                target: payload.from,
                data: { isMuted, isVideoOff },
              } satisfies SignalPayload,
            })

            const shouldCreateOffer = myUserId.localeCompare(payload.from) < 0
            console.log('[DEBUG] Offer decision:', { myUserId, theirId: payload.from, comparison: myUserId.localeCompare(payload.from), shouldCreateOffer })
            if (shouldCreateOffer) {
              console.log('[DEBUG] Creating offer for', payload.from)
              const offer = await pm.createOffer(payload.from)
              console.log('[DEBUG] createOffer result:', offer ? 'SUCCESS' : 'NULL/FAILED', 'for', payload.from)
              if (offer) {
                console.log('[DEBUG] Sending offer to', payload.from)
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
              } else {
                console.log('[DEBUG] Offer creation failed for', payload.from)
              }
            } else {
              console.log('[DEBUG] NOT creating offer (waiting for offer from them)')
            }
          }

          if (payload.type === SignalType.Offer) {
            const data = payload.data as { offer: RTCSessionDescriptionInit; displayName: string } | null
            console.log('[DEBUG] Offer received from:', payload.from, 'data exists:', !!data, 'offer exists:', !!data?.offer, 'sdp exists:', !!data?.offer?.sdp)
            if (!data || !data.offer || !data.offer.sdp) {
              console.log('[DEBUG] Offer invalid, returning')
              return
            }
            const { offer: offerData, displayName: theirName } = data
            
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

            dispatch(updateParticipant({
              userId: payload.from,
              displayName: theirName || payload.from,
            }))

            console.log('[DEBUG] Sending MediaState in response to offer from', payload.from)
            channel.send({
              type: 'broadcast',
              event: 'signal',
              payload: {
                type: SignalType.MediaState,
                from: myUserId,
                target: payload.from,
                data: { isMuted, isVideoOff },
              } satisfies SignalPayload,
            })

            try {
              console.log('[DEBUG] handleOffer for', payload.from)
              const answer = await pm.handleOffer(payload.from, reconstructedOffer)
              console.log('[DEBUG] handleOffer result:', answer?.sdp ? 'SUCCESS' : 'FAILED', 'for', payload.from)
              if (!answer.sdp) {
                return
              }
              const validAnswer: RTCSessionDescriptionInit = {
                type: 'answer' as RTCSdpType,
                sdp: answer.sdp
              }
              console.log('[DEBUG] Sending answer to', payload.from)
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
              console.log('[DEBUG] handleOffer error:', err)
            }
          }

          if (payload.type === SignalType.Answer) {
            const answerData = payload.data as RTCSessionDescriptionInit | null
            console.log('[DEBUG] Answer received from:', payload.from, 'data exists:', !!answerData, 'sdp exists:', !!answerData?.sdp)
            if (!answerData || !answerData.sdp) {
              console.log('[DEBUG] Answer invalid, returning')
              return
            }
            const reconstructedAnswer: RTCSessionDescriptionInit = {
              type: answerData.type || 'answer',
              sdp: answerData.sdp
            }
            console.log('[DEBUG] handleAnswer for', payload.from)
            await pm.handleAnswer(payload.from, reconstructedAnswer)
          }

          if (payload.type === SignalType.IceCandidate) {
            console.log('[DEBUG] IceCandidate received from:', payload.from)
            await pm.handleIceCandidate(payload.from, payload.data as RTCIceCandidateInit)
          }

          if (payload.type === SignalType.MediaState) {
            const data = payload.data as MediaStatePayload | null
            if (!data) return
            dispatch(updateParticipant({
              userId: payload.from,
              isMuted: data.isMuted,
              isVideoOff: data.isVideoOff,
            }))
          }

          if (payload.type === SignalType.UserLeft) {
            dispatch(removeParticipant(payload.from))
            stopAndRemoveRemoteStream(payload.from)
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

            channel.send({
              type: 'broadcast',
              event: 'signal',
              payload: {
                type: SignalType.MediaState,
                from: myUserId,
                data: { isMuted, isVideoOff },
              } satisfies SignalPayload,
            })

            dispatch(setStatus(CallStatus.Connected))
            hasJoinedRef.current = true
            joinInProgressRef.current = false
          }
        })

    } catch (err) {
      dispatch(setError((err as Error).message))
      joinInProgressRef.current = false
    }
  }, [roomId, myUserId, displayName, dispatch, supabase, stopAndRemoveRemoteStream, isMuted, isVideoOff])

  const handleAutoJoin = useCallback(() => {
    if (roomId && roomId.trim() !== '') {
      setTimeout(() => joinRoom(), 0)
    }
  }, [roomId, joinRoom])

  useEffect(() => {
    handleAutoJoin()
  }, [handleAutoJoin])

  const leaveRoom = useCallback(async () => {
    const ch = channelRef.current
    if (ch) {
      await ch.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          type: SignalType.UserLeft,
          from: myUserId,
          data: null,
        } satisfies SignalPayload,
      })
    }

    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    peerManagerRef.current?.destroy()
    remoteStreams.clear()
    localStreamRef.current = null
    setLocalStream(null) 
    joinInProgressRef.current = false
    hasJoinedRef.current = false
    dispatch(resetCall())
  }, [myUserId, dispatch, supabase])

  const toggleAudio = useCallback(async () => {
    const nextMuted = !isMuted
    dispatch(toggleMuteAction())
    await peerManagerRef.current?.toggleAudio(nextMuted)

    const ch = channelRef.current
    if (ch) {
      await ch.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          type: SignalType.MediaState,
          from: myUserId,
          data: { isMuted: nextMuted, isVideoOff },
        } satisfies SignalPayload,
      })
    }
  }, [dispatch, isMuted, isVideoOff, myUserId])

  const toggleVideo = useCallback(async () => {
    const nextVideoOff = !isVideoOff
    dispatch(toggleVideoAction())
    await peerManagerRef.current?.toggleVideo(nextVideoOff)

    const ch = channelRef.current
    if (ch) {
      await ch.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          type: SignalType.MediaState,
          from: myUserId,
          data: { isMuted, isVideoOff: nextVideoOff },
        } satisfies SignalPayload,
      })
    }
  }, [dispatch, isMuted, isVideoOff, myUserId])

  useEffect(() => {
    return () => {
      peerManagerRef.current?.destroy()
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
      joinInProgressRef.current = false
      hasJoinedRef.current = false
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