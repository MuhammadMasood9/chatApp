"use client";
import { useRef, useEffect } from 'react';
import { formatDate } from '@/helper/date';
import { MessageWithSender } from '@/utils/types';
import { MessageBubble } from '@/component/dashboard/MessageBubble';

interface MessageListProps {
  messages: MessageWithSender[];
  isLoading: boolean;
  currentUserId: string;
}

export const MessageList = ({ messages, isLoading, currentUserId }: MessageListProps) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <p className="text-sm">No messages yet</p>
        <p className="text-xs mt-1">Say hello!</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-center">
        <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-slate-100">
          {formatDate(messages[0].createdAt)}
        </span>
      </div>
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isMe={message.senderId === currentUserId}
        />
      ))}
      <div ref={endRef} />
    </>
  );
};