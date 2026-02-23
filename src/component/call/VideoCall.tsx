'use client'

import { useEffect, useRef, useMemo } from 'react'
import { FiMic, FiMicOff, FiVideo, FiVideoOff } from 'react-icons/fi'
import { useAppSelector } from '@/store/hooks'
import { remoteStreams } from '@/hooks/useWebRTC'

interface VideoCallProps {
  localStream: MediaStream | null
  streamVersion?: number
  onEndCall: VoidFunction
  onToggleAudio: VoidFunction
  onToggleVideo: VoidFunction
}

export const VideoCall = ({ localStream, streamVersion, onEndCall, onToggleAudio, onToggleVideo }: VideoCallProps) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const { isMuted, isVideoOff, participants } = useAppSelector(state => state.call)

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    const currentStreams = Array.from(remoteStreams.entries())
    if (currentStreams.length > 0) {
    }
  }, [streamVersion])

  const participantCount = Object.keys(participants).length + 1

  const gridClasses = useMemo(() => {
    if (participantCount === 1) return 'grid-cols-1'
    if (participantCount === 2) return 'grid-cols-1 sm:grid-cols-2'
    if (participantCount <= 4) return 'grid-cols-1 sm:grid-cols-2'
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  }, [participantCount])

  const videoHeightClass = useMemo(() => {
    if (participantCount === 1) return 'h-[60vh] sm:h-[70vh]'
    if (participantCount === 2) return 'h-[40vh] sm:h-full'
    return 'h-[35vh] sm:h-[45vh] lg:h-full'
  }, [participantCount]) 

  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement | null>>(new Map())

  useEffect(() => {
    for (const [userId, stream] of remoteStreams.entries()) {
      const videoEl = remoteVideoRefs.current.get(userId)
      if (videoEl && videoEl.srcObject !== stream) {
        videoEl.srcObject = stream
        videoEl.play().catch(() => {})
      }
    }
  }, [streamVersion])

  return (
    <div className="flex flex-col h-full bg-slate-900">
    
      <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-800 border-b border-slate-700">
        <div className="text-white">
          <h2 className="text-base sm:text-lg font-semibold">Video Call</h2>
          <p className="text-xs sm:text-sm text-slate-300">{participantCount} participant{participantCount !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={onEndCall}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm sm:text-base"
        >
          End Call
        </button>
      </div>

    
      <div className="flex-1 p-2 sm:p-4 min-h-0 overflow-hidden">
        <div className={`grid gap-2 sm:gap-4 ${gridClasses} h-full`}>
        
          <div className={`relative bg-slate-800 rounded-lg overflow-hidden ${videoHeightClass}`}>
            {localStream && !isVideoOff ? (
              <video
                ref={(videoEl) => {
                  localVideoRef.current = videoEl
                  if (videoEl && localStream && videoEl.srcObject !== localStream) {
                    videoEl.srcObject = localStream
                  }
                }}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl sm:text-2xl">You</span>
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-xs sm:text-sm">
              You {isMuted && <span className="ml-1">Muted</span>} {isVideoOff && <span className="ml-1">Cam Off</span>}
            </div>
          </div>

       
          {Object.entries(participants).map(([userId, participant]) => {
            const stream = remoteStreams.get(userId)
            const shouldShowVideo = stream && !participant.isVideoOff
            return (
              <div key={userId} className={`relative bg-slate-800 rounded-lg overflow-hidden ${videoHeightClass}`}>
                {shouldShowVideo ? (
                  <video
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    ref={(videoEl) => {
                      remoteVideoRefs.current.set(userId, videoEl)
                      if (videoEl && videoEl.srcObject !== stream) {
                        videoEl.srcObject = stream
                      }
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl sm:text-2xl">
                        {participant.displayName.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-xs sm:text-sm max-w-[90%] truncate">
                  {participant.displayName}
                  {participant.isMuted && <span className="ml-1">Muted</span>}
                  {participant.isVideoOff && <span className="ml-1">Cam Off</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-center p-3 sm:p-4 bg-slate-800 border-t border-slate-700 space-x-3 sm:space-x-4">
        <button
          onClick={onToggleAudio}
          className={`p-2.5 sm:p-3 rounded-full transition-colors ${
            isMuted 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-slate-700 hover:bg-slate-600 text-white'
          }`}
        >
          {isMuted ? <FiMicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <FiMic className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>

        <button
          onClick={onToggleVideo}
          className={`p-2.5 sm:p-3 rounded-full transition-colors ${
            isVideoOff 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-slate-700 hover:bg-slate-600 text-white'
          }`}
        >
          {isVideoOff ? <FiVideoOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <FiVideo className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>
      </div>
    </div>
  )
}
