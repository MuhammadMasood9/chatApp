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

  async createOffer(targetUserId: string): Promise<RTCSessionDescriptionInit> {
    const pc = this.createPeer(targetUserId, true)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    return offer
  }

  async handleOffer(
    fromUserId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> {
    const pc = this.createPeer(fromUserId, false)
    await pc.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    return answer
  }

  async handleAnswer(fromUserId: string, answer: RTCSessionDescriptionInit) {
    const pc = this.peers.get(fromUserId)
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer))
    }
  }

  async handleIceCandidate(fromUserId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peers.get(fromUserId)
    if (pc && pc.remoteDescription) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    }
  }

  removePeer(userId: string) {
    const pc = this.peers.get(userId)
    if (pc) {
      pc.close()
      this.peers.delete(userId)
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
    this.localStream?.getTracks().forEach(t => t.stop())
    this.localStream = null
  }
}