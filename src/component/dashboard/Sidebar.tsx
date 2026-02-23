"use client";
import { FiSearch, FiFilter, FiSettings, FiLogOut, FiUserPlus, FiX } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { RoutePath } from '@/constants/routes';
import { RoomWithDetails } from '@/utils/types';
import { ContactsModal } from '@/component/dashboard/Contactsmodal';
import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { Skeleton } from '@/component/ui/Skeleton';

interface SidebarProps {
  rooms: RoomWithDetails[];
  selectedRoomId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectRoom: (id: string) => void;
  onClose: VoidFunction;
  isOpen: boolean;
  getRoomLabel: (room: RoomWithDetails) => string;
  getRoomInitials: (room: RoomWithDetails) => string;
  isLoading?: boolean;
}

export const Sidebar = ({
  rooms, selectedRoomId, searchQuery, onSearchChange,
  onSelectRoom, onClose, isOpen, getRoomLabel, getRoomInitials, isLoading,
}: SidebarProps) => {
  const router = useRouter();
  const { user } = useAppSelector(state => state.auth);
  const presenceUsers = useAppSelector(state => state.presence.users);

  const filtered = rooms.filter((r) =>
    getRoomLabel(r).toLowerCase().includes(searchQuery.toLowerCase())
  );
  const [showContacts, setShowContacts] = useState<boolean>(false);

  return (
    <>
    <div className={`fixed lg:absolute inset-y-0 left-0 transition-all duration-300 ease-in-out z-40 ${
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    } w-[280px] sm:w-80 bg-white border-r border-slate-100 flex flex-col h-full shadow-xl lg:shadow-none`}>

      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Messages</h2>
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shadow-blue-200">
              {rooms.length}
            </span>
            <button className="lg:hidden p-2 text-slate-400 hover:text-slate-600 transition-colors" onClick={onClose}>
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="relative group">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button className="whitespace-nowrap px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 transition-colors">
            All Chats
          </button>
          <button className="p-2 bg-slate-50 text-slate-600 rounded-full hover:bg-slate-100 transition-colors border border-slate-100 flex-shrink-0">
            <FiFilter className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl">
              <Skeleton variant="circle" width="3rem" height="3rem" />
              <div className="flex-1 space-y-1">
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="50%" height="0.5rem" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm">
            <p>No conversations yet</p>
            <p className="text-xs mt-1">Accept a contact to start chatting</p>
          </div>
        ) : (
          filtered.map((room) => (
            <div
              key={room.id}
              onClick={() => onSelectRoom(room.id)}
              className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all group ${
                selectedRoomId === room.id ? 'bg-blue-50 shadow-sm' : 'hover:bg-slate-50'
              }`}
            >
              {(() => {
                const peerMember = room.type === 'direct' && user
                  ? room.members.find(m => m.userId !== user.id)
                  : undefined
                const peerUserId = peerMember?.userId
                const isOnline = peerUserId ? (presenceUsers[peerUserId]?.isOnline ?? false) : false
                const avatarUrl = peerMember?.profile?.avatar_url
                const initials = getRoomInitials(room)

                return (
                  <div className="relative flex-shrink-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={initials}
                        className={`w-12 h-12 rounded-2xl object-cover shadow-sm ${
                          selectedRoomId === room.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                        }`}
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shadow-sm ${
                        selectedRoomId === room.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {initials}
                      </div>
                    )}
                    {room.type === 'direct' ? (
                      <div
                        className={`absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          isOnline ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    ) : null}
                  </div>
                )
              })()}
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold truncate text-sm ${
                  selectedRoomId === room.id ? 'text-blue-900' : 'text-slate-900'
                }`}>
                  {getRoomLabel(room)}
                </h3>
                <span className="text-[10px] text-slate-400 capitalize">{room.type} room</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-auto border-t border-slate-100 bg-white">
        <div className="p-3 space-y-1">
          <button
            onClick={() => setShowContacts(true)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-blue-50 text-blue-600 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
              <FiUserPlus className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-sm">Contacts</h3>
              <p className="text-xs opacity-70">Invites & requests</p>
            </div>
          </button>

          <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
              <FiSettings className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-sm text-slate-900">Settings</h3>
              <p className="text-xs text-slate-500">Account & Profile</p>
            </div>
            <button
              onClick={() => router.push(RoutePath.SETTING)}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <FiLogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
      {showContacts && (
  <ContactsModal isOpen={showContacts} onClose={() => setShowContacts(false)} />
)}
  </>
  );
};
 