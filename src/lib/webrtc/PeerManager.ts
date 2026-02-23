import { RTC_CONFIG } from '@/lib/webrtc/config'
import { SignalType } from '@/utils/calls'
import type { SignalPayload } from '@/utils/calls'

type PeerEventHandlers = {
  onRemoteStream: (userId: string, stream: MediaStream) => void
  onConnectionStateChange: (userId: string, state: RTCPeerConnectionState) => void
  onIceCandidate: (payload: SignalPayload) => void
}

type SdpWire = {
  type?: RTCSdpType | null
  sdp?: string | null
}

type OfferEnvelope = {
  offer: SdpWire
}

type AnswerEnvelope = {
  answer: SdpWire
}

type SdpPayload = SdpWire | OfferEnvelope | AnswerEnvelope | string

export class PeerManager {
  private peers: Map<string, RTCPeerConnection> = new Map()
  private localStream: MediaStream | null = null
  private myUserId: string
  private handlers: PeerEventHandlers
  private peerStates: Map<string, 'idle' | 'have-local-offer' | 'have-remote-offer' | 'stable'> = new Map()
  private pendingIce: Map<string, RTCIceCandidateInit[]> = new Map()
  private makingOffer: Map<string, boolean> = new Map()
  private reportedStreams: Set<string> = new Set()

  private parseSdpPayload(payload: SdpPayload, forcedType: RTCSdpType): RTCSessionDescriptionInit {
    let parsed: SdpWire | OfferEnvelope | AnswerEnvelope

    if (typeof payload === 'string') {
      parsed = JSON.parse(payload) as SdpWire | OfferEnvelope | AnswerEnvelope
    } else {
      parsed = payload
    }

    const candidate: SdpWire =
      'offer' in parsed ? parsed.offer : 'answer' in parsed ? parsed.answer : parsed

    if (!candidate.sdp) {
      throw new Error(`Invalid ${forcedType}: missing sdp`)
    }

    return {
      type: forcedType,
      sdp: candidate.sdp,
    }
  }

  constructor(myUserId: string, handlers: PeerEventHandlers) {
    this.myUserId = myUserId
    this.handlers = handlers
  }

  setLocalStream(stream: MediaStream) {
    this.localStream = stream
    this.peers.forEach((pc) => {
      stream.getTracks().forEach(track => {
        const sender = pc.getSenders().find(s => s.track?.kind === track.kind)
        if (sender) {
          sender.replaceTrack(track)
        } else {
          pc.addTrack(track, stream)
        }
      })
    })
  }

  createPeer(targetUserId: string, isInitiator: boolean): RTCPeerConnection {
    const existing = this.peers.get(targetUserId)
    if (existing && existing.connectionState !== 'closed') {
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          const sender = existing.getSenders().find(s => s.track?.kind === track.kind)
          if (!sender) {
            existing.addTrack(track, this.localStream!)
          }
        })
      }

      if (!this.peerStates.has(targetUserId)) {
        this.peerStates.set(targetUserId, isInitiator ? 'have-local-offer' : 'idle')
      }

      return existing
    }

    if (existing) {
      try {
        existing.close()
      } catch {
        // ignore
      }
    }

    const pc = new RTCPeerConnection(RTC_CONFIG)
    this.peers.set(targetUserId, pc)
    this.peerStates.set(targetUserId, isInitiator ? 'have-local-offer' : 'idle')

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!)
      })
    }

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.handlers.onIceCandidate({
          type: SignalType.IceCandidate,
          from: this.myUserId,
          target: targetUserId,
          data: candidate.toJSON(),
        })
      }
    }

    pc.ontrack = ({ streams }) => {
      if (streams[0]) {
        if (!this.reportedStreams.has(targetUserId)) {
          this.reportedStreams.add(targetUserId)
          this.handlers.onRemoteStream(targetUserId, streams[0])
        }
      }
    }

    pc.onconnectionstatechange = () => {
      this.handlers.onConnectionStateChange(targetUserId, pc.connectionState)
    }

    return pc
  }

  async createOffer(targetUserId: string): Promise<RTCSessionDescriptionInit | null> {
    const currentState = this.peerStates.get(targetUserId)
    if (currentState === 'have-local-offer' || currentState === 'have-remote-offer') {
      return null
    }

    const pc = this.createPeer(targetUserId, true)
    this.makingOffer.set(targetUserId, true)
    try {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      this.peerStates.set(targetUserId, 'have-local-offer')
      return pc.localDescription || offer
    } finally {
      this.makingOffer.set(targetUserId, false)
    }
  }

  async handleOffer(
    fromUserId: string,
    offer: RTCSessionDescriptionInit | OfferEnvelope | string
  ): Promise<RTCSessionDescriptionInit> {
    const normalizedOffer = this.parseSdpPayload(offer as SdpPayload, 'offer')

    let pc = this.peers.get(fromUserId)
    if (!pc) {
      pc = this.createPeer(fromUserId, false)
    }

    const polite = this.myUserId.localeCompare(fromUserId) > 0
    const isMakingOffer = this.makingOffer.get(fromUserId) ?? false
    const offerCollision = isMakingOffer || pc.signalingState !== 'stable'
    if (offerCollision && !polite) {
      return { type: 'answer', sdp: '' }
    }

    if (offerCollision && polite) {
      await pc.setLocalDescription({ type: 'rollback' as RTCSdpType })
      this.peerStates.set(fromUserId, 'idle')
    }

    await pc.setRemoteDescription(normalizedOffer)
    this.peerStates.set(fromUserId, 'have-remote-offer')

    const queued = this.pendingIce.get(fromUserId)
    if (queued && queued.length > 0) {
      for (const c of queued) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(c))
        } catch {
          // ignore
        }
      }
      this.pendingIce.delete(fromUserId)
    }

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    this.peerStates.set(fromUserId, 'stable')
    return pc.localDescription || answer
  }

  async handleAnswer(fromUserId: string, answer: RTCSessionDescriptionInit) {
    const pc = this.peers.get(fromUserId)
    if (!pc) return

    if (pc.signalingState !== 'have-local-offer') {
      return
    }

    try {
      if (pc.signalingState !== 'have-local-offer') {
        return
      }
      const normalizedAnswer = this.parseSdpPayload(answer as SdpPayload, 'answer')
      await pc.setRemoteDescription(normalizedAnswer)
      this.peerStates.set(fromUserId, 'stable')

      const queued = this.pendingIce.get(fromUserId)
      if (queued && queued.length > 0) {
        for (const c of queued) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c))
          } catch {
            // ignore
          }
        }
        this.pendingIce.delete(fromUserId)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('Called in wrong state: stable')) {
        this.peerStates.set(fromUserId, 'stable')
        return
      }
      console.error('setRemoteDescription failed:', err)
    }
  }

  async handleIceCandidate(fromUserId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peers.get(fromUserId)
    if (!pc) return

    if (!pc.remoteDescription) {
      const existing = this.pendingIce.get(fromUserId) ?? []
      existing.push(candidate)
      this.pendingIce.set(fromUserId, existing)
      return
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    } catch {
      // ignore
    }
  }

  removePeer(userId: string) {
    const pc = this.peers.get(userId)
    if (pc) {
      pc.close()
      this.peers.delete(userId)
      this.peerStates.delete(userId)
      this.pendingIce.delete(userId)
      this.reportedStreams.delete(userId)
    }
  }

  async toggleAudio(mute: boolean) {
    this.localStream?.getAudioTracks().forEach(t => (t.enabled = !mute))
  }

  async toggleVideo(off: boolean) {
    this.localStream?.getVideoTracks().forEach(t => (t.enabled = !off))
  }

  destroy() {
    this.peers.forEach(pc => pc.close())
    this.peers.clear()
    this.pendingIce.clear()
    this.localStream?.getTracks().forEach(t => t.stop())
    this.localStream = null
  }
}