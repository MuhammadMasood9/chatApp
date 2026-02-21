"use client";
import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useRooms, getDirectRoomPeer } from '@/hooks/useRoom';
import { useStreamingSendMessage } from '@/hooks/useStreamingMessages';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useCallInvitation } from '@/hooks/useCallInvitation';
import { callService } from '@/services/callService';
import { RoomWithDetails } from '@/utils/types';
import { Sidebar } from '@/component/dashboard/Sidebar';
import { ChatHeader } from '@/component/dashboard/ChatHeader';
import { StreamingMessageList } from '@/component/dashboard/StreamingMessageList';
import { StreamingMessageInput } from '@/component/dashboard/StreamingMessageInput';
import { EmptyState } from '@/component/dashboard/EmptyState';
import { VideoCall } from '@/component/call/VideoCall';
import { CallButton } from '@/component/call/CallButton';
import { CallInvitationModal } from '@/component/call/CallInvitationModal';
import { useSearchParams } from 'next/navigation';
import { usePresenceDbSync } from '@/hooks/usePresenceDbSync';

const DashboardLayout = () => {
  const { user } = useAppSelector((state) => state.auth);
  const searchParams = useSearchParams();
  usePresenceDbSync();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isInCall, setIsInCall] = useState<boolean>(false);
  const [roomIdFromUrl, setRoomIdFromUrl] = useState<string | null>(null);

  const { data: rooms = [], isLoading, error } = useRooms();
  const sendMessage = useStreamingSendMessage(selectedRoomId);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null;
  
  const { pendingInvitations, currentInvitation, handleAccept, handleDecline } = useCallInvitation(null, isInCall);
  
  const { localStream, joinRoom, leaveRoom, toggleAudio, toggleVideo } = useWebRTC(
    isInCall && selectedRoomId ? selectedRoomId : ''
  );

  useEffect(() => {
    const roomId = searchParams.get('roomId');
    if (roomId !== roomIdFromUrl) {
      setRoomIdFromUrl(roomId);
      if (roomId) {
        setSelectedRoomId(roomId);
        setTimeout(() => {
          setIsInCall(true);
        }, 1000);
      }
    }
  }, [roomIdFromUrl]); 

  const getRoomLabel = (room: RoomWithDetails) => {
    if (room.type === 'direct' && user) {
      const peer = getDirectRoomPeer(room, user.id);
      return peer?.profile?.display_name ?? peer?.profile?.username ?? 'Unknown';
    }
    return room.name ?? 'Group Room';
  };

  const getRoomInitials = (room: RoomWithDetails) =>
    getRoomLabel(room).slice(0, 2).toUpperCase();

  const getRoomAvatarUrl = (room: RoomWithDetails) => {
    if (room.type === 'direct' && user) {
      const peer = getDirectRoomPeer(room, user.id);
      return peer?.profile?.avatar_url ?? null;
    }
    return room.avatarUrl ?? null;
  };

  const handleSelectRoom = (id: string) => {
    setSelectedRoomId(id);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleStartCallAfterAccept = async () => {
    setIsInCall(true);
    setTimeout(async () => {
      await joinRoom();
    }, 100);
  };

  useEffect(() => {
    const handleAcceptCall = (event: CustomEvent) => {
      const { roomId: invitedRoomId } = event.detail;
      
      if (invitedRoomId !== selectedRoomId) {
        setSelectedRoomId(invitedRoomId);
      }
      
      setTimeout(() => {
        handleStartCallAfterAccept();
      }, 100);
    };

    window.addEventListener('accept-call', handleAcceptCall as EventListener);
    return () => {
      window.removeEventListener('accept-call', handleAcceptCall as EventListener);
    };
  }, [selectedRoomId]);



  const handleStartCall = async () => {
    if (!selectedRoomId || !selectedRoom || !user) return;
    
    try {
      const peer = getDirectRoomPeer(selectedRoom, user.id);
      if (peer) {
        await callService.sendCallInvitation(selectedRoomId, user.id, peer.userId);
      }
      setIsInCall(true);
      await joinRoom();
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };

  const handleEndCall = async () => {
    await leaveRoom();
    setIsInCall(false);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">Failed to load rooms: {error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans text-slate-900">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        rooms={rooms}
        selectedRoomId={selectedRoomId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectRoom={handleSelectRoom}
        onClose={() => setIsSidebarOpen(false)}
        isOpen={isSidebarOpen}
        getRoomLabel={getRoomLabel}
        getRoomInitials={getRoomInitials}
        isLoading={isLoading}
      />

      <div className="flex-1 flex flex-col bg-white transition-all duration-300 w-full lg:pl-80">
        {selectedRoom ? (
          isInCall ? (
            <VideoCall
              localStream={localStream}
              onEndCall={handleEndCall}
              onToggleAudio={toggleAudio}
              onToggleVideo={toggleVideo}
            />
          ) : (
            <>
              <ChatHeader
                room={selectedRoom}
                label={getRoomLabel(selectedRoom)}
                initials={getRoomInitials(selectedRoom)}
                avatarUrl={getRoomAvatarUrl(selectedRoom)}
                onBack={() => { setSelectedRoomId(null); setIsSidebarOpen(true); }}
                actions={
                  <CallButton
                    onStartCall={handleStartCall}
                    disabled={selectedRoom.type !== 'direct'}
                  />
                }
              />
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-4">
                  <StreamingMessageList
                    roomId={selectedRoomId}
                  />
                </div>
              </div>
              <StreamingMessageInput
                roomId={selectedRoomId}
              />
            </>
          )
        ) : (
          <EmptyState onOpenSidebar={() => setIsSidebarOpen(true)} />
        )}
      </div>
      <CallInvitationModal
        invitation={currentInvitation}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    </div>
  );
};

export default DashboardLayout;