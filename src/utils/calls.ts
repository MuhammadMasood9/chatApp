export enum CallStatus {
  Idle = 'idle',
  Joining = 'joining',
  Connected = 'connected',
  Disconnected = 'disconnected',
  Error = 'error'
}

export enum SignalType {
  Offer = 'offer',
  Answer = 'answer',
  IceCandidate = 'ice-candidate',
  UserJoined = 'user-joined',
  UserLeft = 'user-left',
  CallInvitation = 'call-invitation'
}

export interface Participant {
  userId: string
  displayName: string
  stream?: MediaStream
  isMuted: boolean
  isVideoOff: boolean
  connectionState: RTCPeerConnectionState
}

export interface SignalPayload {
  type: SignalType
  from: string
  target?: string
  data: RTCSessionDescriptionInit | RTCIceCandidateInit | { displayName: string } | null
}

export interface CallState {
  roomId: string | null
  myUserId: string
  status: CallStatus
  participants: Record<string, Participant>
  isMuted: boolean
  isVideoOff: boolean
  error: string | null
}