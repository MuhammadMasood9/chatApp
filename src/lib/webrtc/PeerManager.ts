import { RTC_CONFIG } from '@/lib/webrtc/config'
import { SignalType } from '@/utils/calls'
import type { SignalPayload } from '@/utils/calls'

type PeerEventHandlers = {
  onRemoteStream: (userId: string, stream: MediaStream) => void
  onConnectionStateChange: (userId: string, state: RTCPeerConnectionState) => void
  onIceCandidate: (payload: SignalPayload) => void
}

export class PeerManager {
  private peers: Map<string, RTCPeerConnection> = new Map()
  private localStream: MediaStream | null = null
  private myUserId: string
  private handlers: PeerEventHandlers
  private peerStates: Map<string, 'idle' | 'have-local-offer' | 'have-remote-offer' | 'stable'> = new Map()
  private pendingIce: Map<string, RTCIceCandidateInit[]> = new Map()

  constructor(myUserId: string, handlers: PeerEventHandlers) {
    this.myUserId = myUserId
    this.handlers = handlers
  }

  setLocalStream(stream: MediaStream) {
    this.localStream = stream
    this.peers.forEach((pc, userId) => {
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
    if (this.peers.has(targetUserId)) {
      this.peers.get(targetUserId)!.close()
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
        this.handlers.onRemoteStream(targetUserId, streams[0])
      }
    }

    pc.onconnectionstatechange = () => {
      this.handlers.onConnectionStateChange(targetUserId, pc.connectionState)
    }

    return pc
  }

  async createOffer(targetUserId: string): Promise<RTCSessionDescriptionInit | null> {
    const currentState = this.peerStates.get(targetUserId)
    if (currentState === 'have-local-offer') {
      return null
    }
    
    const pc = this.createPeer(targetUserId, true)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    this.peerStates.set(targetUserId, 'have-local-offer')
    return pc.localDescription || offer
  }

  async handleOffer(
    fromUserId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> {
    const raw: unknown = offer as unknown
    let parsed: any = raw

    // Some transports can deliver payload.data as a JSON string
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed)
      } catch {
        // ignore
      }
    }

    // Accept both shapes: {type,sdp} OR {offer:{type,sdp}}
    const candidate = parsed?.offer ?? parsed
    const sdp: unknown = candidate?.sdp

    if (typeof sdp !== 'string' || sdp.length === 0) {
      throw new Error(`Invalid offer: type=${candidate?.type}, sdp present=${typeof sdp === 'string'}`)
    }

    // Always force the correct type to avoid null/invalid enum in production.
    const normalizedOffer: RTCSessionDescriptionInit = {
      type: 'offer',
      sdp,
    }

    const currentState = this.peerStates.get(fromUserId)

    const pc = this.createPeer(fromUserId, false)
    try {
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
    } catch (err) {
    
      throw err
    }
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    return pc.localDescription || answer
  }

  async handleAnswer(fromUserId: string, answer: RTCSessionDescriptionInit) {
    const pc = this.peers.get(fromUserId)
    if (pc) {
      const currentState = this.peerStates.get(fromUserId)
      if (currentState === 'have-local-offer' || currentState === 'have-remote-offer') {
        console.log('handleAnswer: setting remote answer for', fromUserId)
        try {
          let normalizedAnswer: RTCSessionDescriptionInit = answer
          const raw: unknown = answer as unknown
          let parsed: any = raw
          if (typeof parsed === 'string') {
            try {
              parsed = JSON.parse(parsed)
            } catch {
              // ignore
            }
          }
          const candidate = parsed?.answer ?? parsed
          const sdp: unknown = candidate?.sdp
          if (typeof sdp === 'string' && sdp.length > 0) {
            normalizedAnswer = { type: 'answer', sdp }
          }

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
          console.error('setRemoteDescription failed:', err)

        }
      } else {
        console.log('handleAnswer: skipping setRemoteDescription due to state:', currentState)
      }
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

    await pc.addIceCandidate(new RTCIceCandidate(candidate))
  }

  removePeer(userId: string) {
    const pc = this.peers.get(userId)
    if (pc) {
      pc.close()
      this.peers.delete(userId)
      this.peerStates.delete(userId)
      this.pendingIce.delete(userId)
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