"use client";
import { FiPhone, FiVideo, FiGrid, FiChevronLeft } from 'react-icons/fi';
import { Room } from '@/utils/types';

interface ChatHeaderProps {
  room: Room;
  label: string;
  initials: string;
  avatarUrl?: string | null;
  onBack: VoidFunction;
  actions?: React.ReactNode;
}

export const ChatHeader = ({ room, label, initials, avatarUrl, onBack, actions }: ChatHeaderProps) => (
  <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-30">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBack}
          className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={label}
            className="w-10 h-10 rounded-xl object-cover shadow-sm"
          />
        ) : (
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 truncate text-sm sm:text-base">{label}</h3>
          <span className="text-[10px] text-slate-400 capitalize">{room.type} room</span>
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        {actions}
        </div>
    </div>
  </div>
);