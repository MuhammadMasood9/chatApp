"use client";
import { useState, useEffect, useRef } from 'react';
import { FiPaperclip, FiSmile, FiSend } from 'react-icons/fi';
import { useAppSelector } from '@/store/hooks';
import { presenceDbService } from '@/services/presenceDbService';

interface MessageInputProps {
  onSend: (content: string) => void;
  isSending: boolean;
  roomId?: string;
}

export const MessageInput = ({ onSend, isSending, roomId }: MessageInputProps) => {
  const [input, setInput] = useState<string>('');
  const user = useAppSelector(state => state.auth.user);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setTyping = (isTyping: boolean) => {
    if (!user || !roomId) return;
    presenceDbService.upsert({
      user_id: user.id,
      is_online: true,
      is_typping: isTyping
    }).catch(() => undefined);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    
    if (value.trim()) {
      setTyping(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 1000);
    } else {
      setTyping(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isSending) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    setTyping(false);
    onSend(input.trim());
    setInput('');
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-white border-t border-slate-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-sm focus-within:shadow-md focus-within:bg-white focus-within:border-blue-100 transition-all">
        <div className="flex items-center gap-1">
          <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all"><FiPaperclip className="w-5 h-5" /></button>
          <button className="hidden sm:flex p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all"><FiSmile className="w-5 h-5" /></button>
        </div>
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          className="flex-1 bg-transparent border-none focus:ring-0 text-sm sm:text-base text-slate-700 placeholder:text-slate-400 py-2 outline-none"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isSending}
          className="flex items-center justify-center p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-md shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <FiSend className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};