'use client'

import { useEffect, useRef } from 'react'
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhone } from 'react-icons/fi'
import { useAppSelector } from '@/store/hooks'
import { remoteStreams } from '@/hooks/useWebRTC'

interface VideoCallProps {
  localStream: MediaStream | null
  onEndCall: VoidFunction
  onToggleAudio: VoidFunction
  onToggleVideo: VoidFunction
}

export const VideoCall = ({ localStream, onEndCall, onToggleAudio, onToggleVideo }: VideoCallProps) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const { isMuted, isVideoOff, participants } = useAppSelector(state => state.call)

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  const participantCount = Object.keys(participants).length + 1 

  return (
    <div className="flex flex-col h-full bg-slate-900">
    
      <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
        <div className="text-white">
          <h2 className="text-lg font-semibold">Video Call</h2>
          <p className="text-sm text-slate-300">{participantCount} participant{participantCount !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={onEndCall}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          End Call
        </button>
      </div>

    
      <div className="flex-1 p-4">
        <div className={`grid gap-4 h-full ${
          participantCount === 1 ? 'grid-cols-1' :
          participantCount === 2 ? 'grid-cols-2' :
          participantCount <= 4 ? 'grid-cols-2' :
          'grid-cols-3'
        }`}>
        
          <div className="relative bg-slate-800 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
            />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                <div className="w-20 h-20 bg-slate-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl">You</span>
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-sm">
              You {isMuted && '(Muted)'} {isVideoOff && '(Video Off)'}
            </div>
          </div>

       
          {Object.entries(participants).map(([userId, participant]) => {
            const stream = remoteStreams.get(userId)
            return (
              <div key={userId} className="relative bg-slate-800 rounded-lg overflow-hidden">
                {stream ? (
                  <video
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    ref={(videoEl) => {
                      if (videoEl && videoEl.srcObject !== stream) {
                        videoEl.srcObject = stream
                      }
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                    <div className="w-20 h-20 bg-slate-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-2xl">
                        {participant.displayName.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-sm">
                  {participant.displayName}
                  {participant.isMuted && ' (Muted)'}
                  {participant.isVideoOff && ' (Video Off)'}
                  <span className="ml-2 text-xs">
                    ({participant.connectionState})
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-center p-4 bg-slate-800 border-t border-slate-700 space-x-4">
        <button
          onClick={onToggleAudio}
          className={`p-3 rounded-full transition-colors ${
            isMuted 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-slate-700 hover:bg-slate-600 text-white'
          }`}
        >
          {isMuted ? <FiMicOff className="w-6 h-6" /> : <FiMic className="w-6 h-6" />}
        </button>

        <button
          onClick={onToggleVideo}
          className={`p-3 rounded-full transition-colors ${
            isVideoOff 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-slate-700 hover:bg-slate-600 text-white'
          }`}
        >
          {isVideoOff ? <FiVideoOff className="w-6 h-6" /> : <FiVideo className="w-6 h-6" />}
        </button>
      </div>
    </div>
  )
}
